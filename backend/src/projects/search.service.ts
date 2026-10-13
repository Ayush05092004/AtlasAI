import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

interface SearchFilters {
  assigneeId?: string;
  priority?: string;
  status?: string;
  dueBefore?: string;
  dueAfter?: string;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async search(
    userId: string,
    organizationId: string,
    query: string,
    filters: SearchFilters = {},
  ) {
    await this.orgService.assertMembership(userId, organizationId);

    const hasQuery = query && query.trim().length >= 2;
    const hasFilters = Object.values(filters).some(
      (v) => v !== undefined && v !== '',
    );

    if (!hasQuery && !hasFilters) {
      return { projects: [], tasks: [] };
    }

    const taskWhere: Record<string, unknown> = {
      project: { organizationId },
    };

    if (hasQuery) {
      taskWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (filters.assigneeId) {
      taskWhere.assigneeId = filters.assigneeId;
    }
    if (filters.priority) {
      taskWhere.priority = filters.priority;
    }
    if (filters.status) {
      taskWhere.status = filters.status;
    }
    if (filters.dueBefore || filters.dueAfter) {
      const dueDate: Record<string, Date> = {};
      if (filters.dueBefore) dueDate.lte = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDate.gte = new Date(filters.dueAfter);
      taskWhere.dueDate = dueDate;
    }

    const [projects, tasks] = await Promise.all([
      hasQuery
        ? this.prisma.project.findMany({
            where: {
              organizationId,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { key: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, name: true, key: true, status: true },
            take: 8,
          })
        : Promise.resolve([]),
      this.prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true, key: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
    ]);

    return { projects, tasks };
  }

  async getAssignableUsers(userId: string, organizationId: string) {
    await this.orgService.assertMembership(userId, organizationId);
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      select: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return members.map((m) => m.user);
  }
}
