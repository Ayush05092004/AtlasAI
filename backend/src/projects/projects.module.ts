import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [OrganizationsModule, WebhooksModule],
  controllers: [ProjectsController, AnalyticsController, SearchController],
  providers: [ProjectsService, AnalyticsService, SearchService, PrismaService],
})
export class ProjectsModule {}
