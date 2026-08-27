import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInviteDto, AcceptInviteDto } from './dto/invite.dto';

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

  @Get(':organizationId/members')
  getMembers(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.orgService.getMembers(user.userId, organizationId);
  }

  @Post(':organizationId/invites')
  createInvite(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.orgService.createInvite(
      user.userId,
      organizationId,
      dto.email,
      dto.role ?? 'MEMBER',
    );
  }

  @Get(':organizationId/invites')
  getPendingInvites(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.orgService.getPendingInvites(user.userId, organizationId);
  }

  @Delete(':organizationId/invites/:inviteId')
  revokeInvite(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.orgService.revokeInvite(user.userId, organizationId, inviteId);
  }

  @Post('accept-invite')
  acceptInvite(
    @CurrentUser() user: { userId: string; email: string },
    @Body() dto: AcceptInviteDto,
  ) {
    return this.orgService.acceptInvite(user.userId, user.email, dto.token);
  }
}
