import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/projects/:projectId/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(
      user.userId,
      organizationId,
      projectId,
      dto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAllForProject(
      user.userId,
      organizationId,
      projectId,
    );
  }

  @Get(':taskId')
  findOne(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOne(
      user.userId,
      organizationId,
      projectId,
      taskId,
    );
  }

  @Patch(':taskId')
  update(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(
      user.userId,
      organizationId,
      projectId,
      taskId,
      dto,
    );
  }

  @Patch(':taskId/move')
  move(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(
      user.userId,
      organizationId,
      projectId,
      taskId,
      dto,
    );
  }

  @Delete(':taskId')
  remove(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(
      user.userId,
      organizationId,
      projectId,
      taskId,
    );
  }
}
