import { Controller, Get, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get()
  findMine(@CurrentUser() user: { userId: string; email: string }) {
    return this.orgService.findForUser(user.userId);
  }

  @Get(':organizationId')
  findOne(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.orgService.findOne(user.userId, organizationId);
  }
}
