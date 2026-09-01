import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMMENTED'
  | 'TASK_STATUS_CHANGED'
  | 'MENTIONED'
  | 'ORG_INVITE';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Internal helper other services call to actually create a notification. */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
  ) {
    // Never notify someone about their own action (e.g. commenting on your own task).
    return this.prisma.notification.create({
      data: { userId, type, title, body },
    });
  }

  async findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
