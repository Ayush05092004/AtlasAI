import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [AiAssistantController],
  providers: [GeminiService, AiAssistantService, PrismaService],
})
export class AiModule {}
