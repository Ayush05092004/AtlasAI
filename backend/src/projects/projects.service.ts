import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateProjectDto) {
    await this.orgService.assertMembership(userId, organizationId);

    const keyTaken = await this.prisma.project.findUnique({
      where: { organizationId_key: { organizationId, key: dto.key } },
    });
    if (keyTaken) {
      throw new ConflictException(
        `Project key "${dto.key}" is already in use in this organization`,
      );
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        key: dto.key,
        description: dto.description,
        organizationId,
      },
    });
  }

  async findAll(userId: string, organizationId: string) {
    await this.orgService.assertMembership(userId, organizationId);
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async findOne(userId: string, organizationId: string, projectId: string) {
    await this.orgService.assertMembership(userId, organizationId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    userId: string,
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.findOne(userId, organizationId, projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(userId: string, organizationId: string, projectId: string) {
    await this.findOne(userId, organizationId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }
}
