import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '../tasks/dto/task.dto';

export interface ToolResult {
  ok: boolean;
  mutated: boolean;
  summary: string;
  data: Record<string, unknown>;
}

type Args = Record<string, unknown>;

const STATUSES: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const ok = (
  summary: string,
  data: Record<string, unknown>,
  mutated = false,
): ToolResult => ({
  ok: true,
  mutated,
  summary,
  data,
});

const fail = (summary: string): ToolResult => ({
  ok: false,
  mutated: false,
  summary,
  data: { error: summary },
});

function readString(args: Args, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readBoolean(args: Args, key: string): boolean {
  return args[key] === true;
}

function normalizeStatus(value: unknown): TaskStatus | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return STATUSES.find((s) => s === key);
}

function normalizePriority(value: unknown): TaskPriority | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toUpperCase();
  return PRIORITIES.find((p) => p === key);
}

/** Accepts "YYYY-MM-DD" and returns a full ISO timestamp Prisma will accept. */
function parseDueDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('dueDate must be in YYYY-MM-DD format.');
  }
  const iso = `${value}T00:00:00.000Z`;
  if (Number.isNaN(new Date(iso).getTime())) {
    throw new Error(`"${value}" is not a valid date.`);
  }
  return iso;
}

const dateOnly = (date: Date | null): string | null =>
  date ? date.toISOString().slice(0, 10) : null;

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'list_projects',
    description:
      'List every project in the workspace with its key, status and number of tasks.',
  },
  {
    name: 'list_team_members',
    description: 'List the people in this workspace with their role and email.',
  },
  {
    name: 'list_tasks',
    description:
      'Find and list tasks. All filters are optional and can be combined. Returns at most 25 tasks, soonest due date first.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        projectKey: {
          type: SchemaType.STRING,
          description: 'Only tasks in this project, e.g. "WEB".',
        },
        status: {
          type: SchemaType.STRING,
          description: 'One of BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE.',
        },
        priority: {
          type: SchemaType.STRING,
          description: 'One of LOW, MEDIUM, HIGH, URGENT.',
        },
        assignedToMe: {
          type: SchemaType.BOOLEAN,
          description: 'Only tasks assigned to the current user.',
        },
        overdueOnly: {
          type: SchemaType.BOOLEAN,
          description: 'Only tasks that are past their due date and not DONE.',
        },
        search: {
          type: SchemaType.STRING,
          description: 'Text to look for in the task title or description.',
        },
      },
    },
  },
  {
    name: 'get_project_overview',
    description:
      'Get a progress overview of one project: task counts per status, completion percentage, overdue tasks and open high-priority tasks.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        projectKey: {
          type: SchemaType.STRING,
          description: 'The project key, e.g. "WEB".',
        },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a project.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        projectKey: {
          type: SchemaType.STRING,
          description: 'The project key, e.g. "WEB".',
        },
        title: {
          type: SchemaType.STRING,
          description: 'Short, action-oriented task title.',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Optional extra detail.',
        },
        priority: {
          type: SchemaType.STRING,
          description: 'One of LOW, MEDIUM, HIGH, URGENT. Defaults to MEDIUM.',
        },
        dueDate: {
          type: SchemaType.STRING,
          description: 'Optional due date as YYYY-MM-DD.',
        },
      },
      required: ['projectKey', 'title'],
    },
  },
  {
    name: 'update_task_status',
    description:
      'Move a task to a different status column (e.g. mark it as DONE).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskKey: {
          type: SchemaType.STRING,
          description: 'The task key, e.g. "WEB-12".',
        },
        status: {
          type: SchemaType.STRING,
          description: 'One of BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE.',
        },
      },
      required: ['taskKey', 'status'],
    },
  },
  {
    name: 'update_task',
    description:
      "Change a task's title, description, priority or due date. Only send the fields that should change.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskKey: {
          type: SchemaType.STRING,
          description: 'The task key, e.g. "WEB-12".',
        },
        title: { type: SchemaType.STRING, description: 'New title.' },
        description: {
          type: SchemaType.STRING,
          description: 'New description.',
        },
        priority: {
          type: SchemaType.STRING,
          description: 'One of LOW, MEDIUM, HIGH, URGENT.',
        },
        dueDate: {
          type: SchemaType.STRING,
          description: 'New due date as YYYY-MM-DD.',
        },
      },
      required: ['taskKey'],
    },
  },
  {
    name: 'assign_task',
    description:
      'Assign a task to a workspace member by name. Use "me" to assign it to the current user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskKey: {
          type: SchemaType.STRING,
          description: 'The task key, e.g. "WEB-12".',
        },
        memberName: {
          type: SchemaType.STRING,
          description: 'First name, full name or email of the person, or "me".',
        },
      },
      required: ['taskKey', 'memberName'],
    },
  },
  {
    name: 'add_comment',
    description: 'Add a comment to a task.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskKey: {
          type: SchemaType.STRING,
          description: 'The task key, e.g. "WEB-12".',
        },
        body: { type: SchemaType.STRING, description: 'The comment text.' },
      },
      required: ['taskKey', 'body'],
    },
  },
];

@Injectable()
export class AiToolsService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
    private tasksService: TasksService,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    name: string,
    args: Args,
  ): Promise<ToolResult> {
    try {
      await this.orgService.assertMembership(userId, organizationId);

      switch (name) {
        case 'list_projects':
          return await this.listProjects(organizationId);
        case 'list_team_members':
          return await this.listTeamMembers(organizationId);
        case 'list_tasks':
          return await this.listTasks(userId, organizationId, args);
        case 'get_project_overview':
          return await this.getProjectOverview(organizationId, args);
        case 'create_task':
          return await this.createTask(userId, organizationId, args);
        case 'update_task_status':
          return await this.updateTaskStatus(userId, organizationId, args);
        case 'update_task':
          return await this.updateTask(userId, organizationId, args);
        case 'assign_task':
          return await this.assignTask(userId, organizationId, args);
        case 'add_comment':
          return await this.addComment(userId, organizationId, args);
        default:
          return fail(`Unknown tool "${name}".`);
      }
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : 'The action failed.',
      );
    }
  }

  private async resolveProject(
    organizationId: string,
    projectKey: string | undefined,
  ) {
    if (!projectKey) throw new Error('A project key (like "WEB") is required.');
    const key = projectKey.toUpperCase();
    const project = await this.prisma.project.findUnique({
      where: { organizationId_key: { organizationId, key } },
    });
    if (!project) {
      throw new Error(
        `There is no project with key "${key}". Use list_projects to see the valid keys.`,
      );
    }
    return project;
  }

  private async resolveTask(
    organizationId: string,
    taskKey: string | undefined,
  ) {
    const match = taskKey?.trim().match(/^([A-Za-z0-9]{2,6})-(\d+)$/);
    if (!match)
      throw new Error(
        'Task keys look like "WEB-12" (project key, dash, number).',
      );

    const project = await this.resolveProject(organizationId, match[1]);
    const task = await this.prisma.task.findUnique({
      where: {
        projectId_number: { projectId: project.id, number: Number(match[2]) },
      },
    });
    if (!task)
      throw new Error(`Task ${project.key}-${match[2]} was not found.`);
    return { project, task };
  }

  private async listProjects(organizationId: string): Promise<ToolResult> {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });

    return ok(`Listed ${projects.length} projects`, {
      projects: projects.map((p) => ({
        key: p.key,
        name: p.name,
        status: p.status,
        taskCount: p._count.tasks,
      })),
    });
  }

  private async listTeamMembers(organizationId: string): Promise<ToolResult> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      select: {
        role: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return ok(`Listed ${members.length} team members`, {
      members: members.map((m) => ({
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        role: m.role,
      })),
    });
  }

  private async listTasks(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const projectKey = readString(args, 'projectKey');
    const status = normalizeStatus(args['status']);
    const priority = normalizePriority(args['priority']);
    const search = readString(args, 'search');
    const now = new Date();

    const where: Prisma.TaskWhereInput = {
      project: {
        organizationId,
        ...(projectKey ? { key: projectKey.toUpperCase() } : {}),
      },
    };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (readBoolean(args, 'assignedToMe')) where.assigneeId = userId;
    if (readBoolean(args, 'overdueOnly')) {
      where.dueDate = { lt: now };
      if (!status) where.status = { not: 'DONE' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 25,
      include: {
        project: { select: { key: true, name: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
    });

    return ok(`Listed ${tasks.length} tasks`, {
      count: tasks.length,
      tasks: tasks.map((t) => ({
        key: `${t.project.key}-${t.number}`,
        title: t.title,
        project: t.project.name,
        status: STATUS_LABEL[t.status],
        priority: t.priority,
        dueDate: dateOnly(t.dueDate),
        overdue: !!t.dueDate && t.dueDate < now && t.status !== 'DONE',
        assignee: t.assignee
          ? `${t.assignee.firstName} ${t.assignee.lastName}`
          : null,
      })),
    });
  }

  private async getProjectOverview(
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const project = await this.resolveProject(
      organizationId,
      readString(args, 'projectKey'),
    );
    const tasks = await this.prisma.task.findMany({
      where: { projectId: project.id },
      select: {
        number: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    const now = new Date();
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[STATUS_LABEL[t.status]] =
        (byStatus[STATUS_LABEL[t.status]] ?? 0) + 1;
    }

    const open = tasks.filter((t) => t.status !== 'DONE');
    const overdue = open.filter((t) => t.dueDate && t.dueDate < now);
    const highPriority = open.filter(
      (t) => t.priority === 'URGENT' || t.priority === 'HIGH',
    );
    const done = tasks.length - open.length;

    return ok(`Reviewed ${project.key}`, {
      project: { key: project.key, name: project.name, status: project.status },
      totalTasks: tasks.length,
      byStatus,
      completionPercent:
        tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
      overdue: overdue.slice(0, 5).map((t) => ({
        key: `${project.key}-${t.number}`,
        title: t.title,
        dueDate: dateOnly(t.dueDate),
      })),
      openHighPriority: highPriority.slice(0, 5).map((t) => ({
        key: `${project.key}-${t.number}`,
        title: t.title,
        priority: t.priority,
      })),
    });
  }

  private async createTask(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const project = await this.resolveProject(
      organizationId,
      readString(args, 'projectKey'),
    );
    const title = readString(args, 'title');
    if (!title) throw new Error('A task title is required.');

    const description = readString(args, 'description');
    const priority = normalizePriority(args['priority']);
    const dueDate = parseDueDate(args['dueDate']);

    const dto: CreateTaskDto = { title: title.slice(0, 200) };
    if (description) dto.description = description;
    if (priority) dto.priority = priority;
    if (dueDate) dto.dueDate = dueDate;

    const task = await this.tasksService.create(
      userId,
      organizationId,
      project.id,
      dto,
    );
    const key = `${project.key}-${task.number}`;

    return ok(
      `Created ${key} "${task.title}"`,
      {
        key,
        title: task.title,
        status: STATUS_LABEL[task.status],
        priority: task.priority,
        dueDate: dueDate?.slice(0, 10) ?? null,
      },
      true,
    );
  }

  private async updateTaskStatus(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const { project, task } = await this.resolveTask(
      organizationId,
      readString(args, 'taskKey'),
    );
    const status = normalizeStatus(args['status']);
    if (!status)
      throw new Error(
        'status must be one of BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE.',
      );

    const key = `${project.key}-${task.number}`;
    if (task.status === status) {
      return ok(`${key} is already in ${STATUS_LABEL[status]}`, {
        key,
        status: STATUS_LABEL[status],
        changed: false,
      });
    }

    // Append to the end of the destination column.
    const position = await this.prisma.task.count({
      where: { projectId: project.id, status },
    });
    await this.tasksService.move(userId, organizationId, project.id, task.id, {
      status,
      position,
    });

    return ok(
      `Moved ${key} to ${STATUS_LABEL[status]}`,
      {
        key,
        from: STATUS_LABEL[task.status],
        to: STATUS_LABEL[status],
        changed: true,
      },
      true,
    );
  }

  private async updateTask(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const { project, task } = await this.resolveTask(
      organizationId,
      readString(args, 'taskKey'),
    );

    const dto: UpdateTaskDto = {};
    const title = readString(args, 'title');
    const description = readString(args, 'description');
    const priority = normalizePriority(args['priority']);
    const dueDate = parseDueDate(args['dueDate']);

    if (title) dto.title = title.slice(0, 200);
    if (description) dto.description = description;
    if (priority) dto.priority = priority;
    if (dueDate) dto.dueDate = dueDate;

    const changed = Object.keys(dto);
    if (changed.length === 0)
      throw new Error('Nothing to update - no valid fields were provided.');

    await this.tasksService.update(
      userId,
      organizationId,
      project.id,
      task.id,
      dto,
    );
    const key = `${project.key}-${task.number}`;

    return ok(
      `Updated ${key} (${changed.join(', ')})`,
      { key, updatedFields: changed },
      true,
    );
  }

  private async assignTask(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const memberName = readString(args, 'memberName');
    if (!memberName) throw new Error('Who should the task be assigned to?');

    const { project, task } = await this.resolveTask(
      organizationId,
      readString(args, 'taskKey'),
    );

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      select: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const query = memberName.toLowerCase();
    const matches =
      query === 'me' || query === 'myself'
        ? members.filter((m) => m.user.id === userId)
        : members.filter(
            (m) =>
              `${m.user.firstName} ${m.user.lastName}`
                .toLowerCase()
                .includes(query) ||
              m.user.email.toLowerCase().startsWith(query),
          );

    if (matches.length === 0) {
      throw new Error(`Nobody in this workspace matches "${memberName}".`);
    }
    if (matches.length > 1) {
      const names = matches
        .map((m) => `${m.user.firstName} ${m.user.lastName}`)
        .join(', ');
      throw new Error(
        `"${memberName}" matches several people (${names}). Ask the user which one they mean.`,
      );
    }

    const person = matches[0].user;
    await this.tasksService.update(
      userId,
      organizationId,
      project.id,
      task.id,
      { assigneeId: person.id },
    );

    const key = `${project.key}-${task.number}`;
    const fullName = `${person.firstName} ${person.lastName}`;
    return ok(
      `Assigned ${key} to ${fullName}`,
      { key, assignee: fullName },
      true,
    );
  }

  private async addComment(
    userId: string,
    organizationId: string,
    args: Args,
  ): Promise<ToolResult> {
    const body = readString(args, 'body');
    if (!body) throw new Error('The comment text is required.');

    const { project, task } = await this.resolveTask(
      organizationId,
      readString(args, 'taskKey'),
    );
    await this.tasksService.addComment(
      userId,
      organizationId,
      project.id,
      task.id,
      {
        body: body.slice(0, 2000),
      },
    );

    const key = `${project.key}-${task.number}`;
    return ok(`Commented on ${key}`, { key }, true);
  }
}
