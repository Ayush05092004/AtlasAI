import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async search(userId: string, organizationId: string, query: string) {
    await this.orgService.assertMembership(userId, organizationId);

    if (!query || query.trim().length < 2) {
      return { projects: [], tasks: [] };
    }

    const [projects, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { key: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, key: true, status: true },
        take: 8,
      }),
      this.prisma.task.findMany({
        where: {
          project: { organizationId },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          project: { select: { id: true, name: true, key: true } },
        },
        take: 10,
      }),
    ]);

    return { projects, tasks };
  }
}
