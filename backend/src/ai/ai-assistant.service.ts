import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { GeminiService } from './gemini.service';

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface RawGeneratedTask {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
}

@Injectable()
export class AiAssistantService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
    private gemini: GeminiService,
  ) {}

  async generateTasks(
    userId: string,
    organizationId: string,
    goal: string,
  ): Promise<GeneratedTask[]> {
    await this.orgService.assertMembership(userId, organizationId);

    if (!goal || goal.trim().length < 5) {
      throw new BadRequestException(
        'Please describe the goal in a bit more detail.',
      );
    }

    const prompt = `You are a project management assistant. Break the following goal into 4-7 concrete, actionable tasks a software team could work on.

Goal: "${goal}"

Respond with ONLY a JSON array, no other text, no markdown code fences. Each item must have exactly these fields:
- "title": short, specific, action-oriented (max 80 characters)
- "description": one sentence of extra context
- "priority": one of "LOW", "MEDIUM", "HIGH", "URGENT"

Example format:
[{"title": "Set up project repository", "description": "Initialize the codebase with the chosen framework.", "priority": "HIGH"}]`;

    const raw = await this.gemini.generateText(prompt);
    return this.parseTaskList(raw);
  }

  async summarizeProject(
    userId: string,
    organizationId: string,
    projectId: string,
  ): Promise<string> {
    await this.orgService.assertMembership(userId, organizationId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        tasks: {
          select: { title: true, status: true, priority: true, dueDate: true },
        },
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const taskSummary = project.tasks
      .map((t) => `- [${t.status}] ${t.title} (priority: ${t.priority})`)
      .join('\n');

    const prompt = `You are a project management assistant. Write a brief, friendly 2-3 sentence status summary for this project, suitable for a dashboard. Mention overall progress and highlight anything that looks stuck or high-priority.

Project: ${project.name}
Tasks:
${taskSummary || '(no tasks yet)'}

Write only the summary paragraph, no headers, no markdown formatting.`;

    return this.gemini.generateText(prompt);
  }

  private parseTaskList(raw: string): GeneratedTask[] {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new BadRequestException(
        'The AI response could not be understood. Please try again.',
      );
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException(
        'The AI response was not in the expected format.',
      );
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    return (parsed as RawGeneratedTask[])
      .filter(
        (item): item is RawGeneratedTask => typeof item?.title === 'string',
      )
      .map((item) => {
        const priority =
          typeof item.priority === 'string' &&
          validPriorities.includes(item.priority)
            ? (item.priority as GeneratedTask['priority'])
            : 'MEDIUM';

        return {
          title: String(item.title).slice(0, 200),
          description:
            typeof item.description === 'string' ? item.description : '',
          priority,
        };
      });
  }
}
