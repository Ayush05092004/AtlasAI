import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';
import { CreateCommentDto } from './dto/comment.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
    private notificationsService: NotificationsService,
  ) {}

  private async assertProjectAccess(
    userId: string,
    organizationId: string,
    projectId: string,
  ) {
    await this.orgService.assertMembership(userId, organizationId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private logActivity(
    projectId: string,
    userId: string,
    action: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.activityLog.create({
      data: {
        projectId,
        userId,
        action,
        targetType: 'Task',
        targetId,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  }

  async create(
    userId: string,
    organizationId: string,
    projectId: string,
    dto: CreateTaskDto,
  ) {
    await this.assertProjectAccess(userId, organizationId, projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { taskCounter: { increment: 1 } },
    });

    const task = await this.prisma.task.create({
      data: {
        ...dto,
        projectId,
        creatorId: userId,
        number: project.taskCounter,
      },
      include: {
        assignee: { select: SAFE_USER_SELECT },
        creator: { select: SAFE_USER_SELECT },
      },
    });

    await this.logActivity(projectId, userId, 'task.created', task.id, {
      title: task.title,
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notificationsService.create(
        task.assigneeId,
        'TASK_ASSIGNED',
        `You were assigned to "${task.title}"`,
        `${project.name} · #${task.number}`,
      );
    }

    return task;
  }

  async findAllForProject(
    userId: string,
    organizationId: string,
    projectId: string,
  ) {
    await this.assertProjectAccess(userId, organizationId, projectId);
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: { assignee: { select: SAFE_USER_SELECT } },
    });
  }

  async findOne(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.assertProjectAccess(userId, organizationId, projectId);
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: { select: SAFE_USER_SELECT },
        creator: { select: SAFE_USER_SELECT },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.findOne(
      userId,
      organizationId,
      projectId,
      taskId,
    );

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: { assignee: { select: SAFE_USER_SELECT } },
    });

    await this.logActivity(projectId, userId, 'task.updated', taskId, {
      fields: Object.keys(dto),
    });

    if (
      dto.assigneeId &&
      dto.assigneeId !== existing.assigneeId &&
      dto.assigneeId !== userId
    ) {
      await this.notificationsService.create(
        dto.assigneeId,
        'TASK_ASSIGNED',
        `You were assigned to "${updated.title}"`,
        `#${updated.number}`,
      );
    }

    return updated;
  }

  async move(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: MoveTaskDto,
  ) {
    const existing = await this.findOne(
      userId,
      organizationId,
      projectId,
      taskId,
    );

    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: {
          projectId,
          status: dto.status,
          position: { gte: dto.position },
        },
        data: { position: { increment: 1 } },
      }),
      this.prisma.task.update({
        where: { id: taskId },
        data: { status: dto.status, position: dto.position },
      }),
    ]);

    if (existing.status !== dto.status) {
      await this.logActivity(projectId, userId, 'task.status_changed', taskId, {
        from: existing.status,
        to: dto.status,
      });
    }

    return this.findOne(userId, organizationId, projectId, taskId);
  }

  async remove(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
  ) {
    const task = await this.findOne(userId, organizationId, projectId, taskId);
    if (task.creatorId !== userId) {
      await this.orgService.assertCanManage(userId, organizationId);
    }
    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }

  async getComments(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.findOne(userId, organizationId, projectId, taskId);
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: SAFE_USER_SELECT } },
    });
  }

  async addComment(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: CreateCommentDto,
  ) {
    const task = await this.findOne(userId, organizationId, projectId, taskId);

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body,
        taskId,
        authorId: userId,
      },
      include: { author: { select: SAFE_USER_SELECT } },
    });

    await this.logActivity(projectId, userId, 'task.commented', taskId, {
      commentId: comment.id,
    });

    const notifyIds = new Set<string>();
    if (task.creatorId !== userId) notifyIds.add(task.creatorId);
    if (task.assigneeId && task.assigneeId !== userId)
      notifyIds.add(task.assigneeId);

    await Promise.all(
      Array.from(notifyIds).map((recipientId) =>
        this.notificationsService.create(
          recipientId,
          'TASK_COMMENTED',
          `${comment.author.firstName} commented on "${task.title}"`,
          dto.body.slice(0, 100),
        ),
      ),
    );

    return comment;
  }

  async deleteComment(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
    commentId: string,
  ) {
    await this.findOne(userId, organizationId, projectId, taskId);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async getActivity(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.findOne(userId, organizationId, projectId, taskId);
    return this.prisma.activityLog.findMany({
      where: { targetType: 'Task', targetId: taskId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: SAFE_USER_SELECT } },
    });
  }
}
