import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
};

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationsService,
  ) {}

  async getMessages(userId: string, organizationId: string) {
    await this.orgService.assertMembership(userId, organizationId);
    return this.prisma.message.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { author: { select: SAFE_USER_SELECT } },
    });
  }

  async createMessage(userId: string, organizationId: string, body: string) {
    await this.orgService.assertMembership(userId, organizationId);

    if (!body || body.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    return this.prisma.message.create({
      data: {
        organizationId,
        authorId: userId,
        body: body.trim().slice(0, 2000),
      },
      include: { author: { select: SAFE_USER_SELECT } },
    });
  }
}
