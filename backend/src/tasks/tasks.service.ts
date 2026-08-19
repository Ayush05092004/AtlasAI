import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';

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

    return this.prisma.task.create({
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
    await this.findOne(userId, organizationId, projectId, taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: { assignee: { select: SAFE_USER_SELECT } },
    });
  }

  async move(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: MoveTaskDto,
  ) {
    await this.findOne(userId, organizationId, projectId, taskId);

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

    return this.findOne(userId, organizationId, projectId, taskId);
  }

  async remove(
    userId: string,
    organizationId: string,
    projectId: string,
    taskId: string,
  ) {
    await this.findOne(userId, organizationId, projectId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }
}
