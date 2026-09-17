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

interface QuickAddResult {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
}

interface RawQuickAddResult {
  title?: unknown;
  priority?: unknown;
  dueDate?: unknown;
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

  /**
   * Parses one line of freeform text (e.g. "Fix login bug urgent tomorrow")
   * into a structured task - title, priority, and due date if mentioned.
   * Powers the quick-add bar so users never need to open a form.
   */
  async quickAddParse(
    userId: string,
    organizationId: string,
    text: string,
  ): Promise<QuickAddResult> {
    await this.orgService.assertMembership(userId, organizationId);

    if (!text || text.trim().length < 2) {
      throw new BadRequestException('Please type something to add.');
    }

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `You are a task quick-entry parser. Extract a single task from this text.

Text: "${text}"
Today's date is ${today}.

Respond with ONLY a JSON object, no other text, no markdown code fences, with exactly these fields:
- "title": the core task description, with priority/date words removed (max 150 characters)
- "priority": one of "LOW", "MEDIUM", "HIGH", "URGENT" - infer from words like "urgent", "asap", "whenever", "low priority". Default to "MEDIUM" if unclear.
- "dueDate": an ISO date string "YYYY-MM-DD" if a date/day is mentioned (e.g. "tomorrow", "friday", "next week"), otherwise null.

Example: {"title": "Fix login bug", "priority": "URGENT", "dueDate": "2026-09-13"}`;

    const raw = await this.gemini.generateText(prompt);
    return this.parseQuickAdd(raw);
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

  private parseQuickAdd(raw: string): QuickAddResult {
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
        'Could not understand that. Please try rephrasing.',
      );
    }

    const item = parsed as RawQuickAddResult;
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (typeof item?.title !== 'string' || item.title.trim().length === 0) {
      throw new BadRequestException(
        'Could not extract a task title. Please try rephrasing.',
      );
    }

    const priority =
      typeof item.priority === 'string' &&
      validPriorities.includes(item.priority)
        ? (item.priority as QuickAddResult['priority'])
        : 'MEDIUM';

    const dueDate =
      typeof item.dueDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
        ? item.dueDate
        : null;

    return {
      title: item.title.trim().slice(0, 200),
      priority,
      dueDate,
    };
  }
}
