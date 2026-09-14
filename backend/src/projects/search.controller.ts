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
  ) {
    return this.searchService.search(user.userId, organizationId, query);
  }
}
