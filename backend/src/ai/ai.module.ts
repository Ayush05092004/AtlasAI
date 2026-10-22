import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiAgentService } from './ai-agent.service';
import { AiToolsService } from './ai-tools.service';
import { AiAssistantController } from './ai-assistant.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [OrganizationsModule, TasksModule],
  controllers: [AiAssistantController],
  providers: [
    GeminiService,
    AiAssistantService,
    AiToolsService,
    AiAgentService,
    PrismaService,
  ],
})
export class AiModule {}
