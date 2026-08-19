import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.userId, organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.projectsService.findAll(user.userId, organizationId);
  }

  @Get(':projectId')
  findOne(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(user.userId, organizationId, projectId);
  }

  @Patch(':projectId')
  update(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(
      user.userId,
      organizationId,
      projectId,
      dto,
    );
  }

  @Delete(':projectId')
  remove(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(user.userId, organizationId, projectId);
  }
}
