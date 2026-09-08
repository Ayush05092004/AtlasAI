import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async getOverview(userId: string, organizationId: string) {
    await this.orgService.assertMembership(userId, organizationId);

    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        tasks: {
          select: {
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const allTasks = projects.flatMap((p) => p.tasks);

    // Tasks grouped by status, across every project in the org.
    const statusCounts: Record<string, number> = {};
    for (const task of allTasks) {
      statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1;
    }

    // Tasks grouped by priority.
    const priorityCounts: Record<string, number> = {};
    for (const task of allTasks) {
      priorityCounts[task.priority] = (priorityCounts[task.priority] ?? 0) + 1;
    }

    // Per-project completion percentage.
    const projectProgress = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === 'DONE').length;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        totalTasks: total,
        doneTasks: done,
        completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
      };
    });

    // Tasks completed per day, last 14 days - built from updatedAt on DONE tasks.
    const completedTrend: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayKey = day.toISOString().slice(0, 10);

      const count = allTasks.filter((t) => {
        if (t.status !== 'DONE') return false;
        return new Date(t.updatedAt).toISOString().slice(0, 10) === dayKey;
      }).length;

      completedTrend.push({ date: dayKey, count });
    }

    return {
      totalTasks: allTasks.length,
      totalProjects: projects.length,
      statusCounts,
      priorityCounts,
      projectProgress,
      completedTrend,
    };
  }
}
