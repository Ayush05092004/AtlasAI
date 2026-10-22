import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAgentService, AgentReply } from './ai-agent.service';
import { GenerateTasksDto, QuickAddDto, AgentChatDto } from './dto/ai.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/ai')
export class AiAssistantController {
  constructor(
    private aiService: AiAssistantService,
    private agentService: AiAgentService,
  ) {}

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

  @Post('quick-add')
  quickAdd(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: QuickAddDto,
  ): Promise<{
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string | null;
  }> {
    return this.aiService.quickAddParse(user.userId, organizationId, dto.text);
  }

  @Post('chat')
  chat(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: AgentChatDto,
  ): Promise<AgentReply> {
    return this.agentService.chat(
      user.userId,
      organizationId,
      dto.message,
      dto.history ?? [],
    );
  }
}
