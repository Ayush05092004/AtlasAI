import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { GenerateTasksDto } from './dto/ai.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/ai')
export class AiAssistantController {
  constructor(private aiService: AiAssistantService) {}

  @Post('generate-tasks')
  generateTasks(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: GenerateTasksDto,
  ): Promise<
    {
      title: string;
      description: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }[]
  > {
    return this.aiService.generateTasks(user.userId, organizationId, dto.goal);
  }

  @Get('projects/:projectId/summary')
  summarizeProject(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
  ): Promise<string> {
    return this.aiService.summarizeProject(
      user.userId,
      organizationId,
      projectId,
    );
  }
}
