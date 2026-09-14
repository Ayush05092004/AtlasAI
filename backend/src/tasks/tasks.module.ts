import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController, MyTasksController } from './tasks.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [OrganizationsModule, NotificationsModule],
  controllers: [TasksController, MyTasksController],
  providers: [TasksService, PrismaService],
})
export class TasksModule {}
