import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Query('q') query: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('dueAfter') dueAfter?: string,
  ) {
    return this.searchService.search(user.userId, organizationId, query, {
      assigneeId,
      priority,
      status,
      dueBefore,
      dueAfter,
    });
  }

  @Get('assignable-users')
  getAssignableUsers(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.searchService.getAssignableUsers(user.userId, organizationId);
  }
}
