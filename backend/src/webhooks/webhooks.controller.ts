import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/webhook.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.webhooksService.list(user.userId, organizationId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(
      user.userId,
      organizationId,
      dto.name,
      dto.url,
      dto.event,
    );
  }

  @Delete(':webhookId')
  remove(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
    @Param('webhookId') webhookId: string,
  ) {
    return this.webhooksService.remove(user.userId, organizationId, webhookId);
  }
}
