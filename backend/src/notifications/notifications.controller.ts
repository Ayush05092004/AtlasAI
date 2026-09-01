import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string; email: string }) {
    return this.notificationsService.findForUser(user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { userId: string; email: string }) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser() user: { userId: string; email: string },
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, notificationId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { userId: string; email: string }) {
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
