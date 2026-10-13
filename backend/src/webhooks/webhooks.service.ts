import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async list(userId: string, organizationId: string) {
    await this.orgService.assertMembership(userId, organizationId);
    return this.prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    organizationId: string,
    name: string,
    url: string,
    event: string,
  ) {
    await this.orgService.assertCanManage(userId, organizationId);
    return this.prisma.webhook.create({
      data: { organizationId, name, url, event },
    });
  }

  async remove(userId: string, organizationId: string, webhookId: string) {
    await this.orgService.assertCanManage(userId, organizationId);
    await this.prisma.webhook.delete({ where: { id: webhookId } });
    return { success: true };
  }

  /** Fires all active webhooks subscribed to this event - called by other services. */
  async trigger(
    organizationId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId, event, isActive: true },
    });

    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event,
              data: payload,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          this.logger.warn(
            `Webhook delivery failed for ${webhook.url}: ${String(error)}`,
          );
        }
      }),
    );
  }
}
