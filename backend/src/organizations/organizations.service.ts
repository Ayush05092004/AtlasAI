import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MANAGE_ROLES = ['OWNER', 'ADMIN'];

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  /** Called automatically right after a user registers. */
  async createDefaultOrg(userId: string, userFirstName: string) {
    const slug = `${userFirstName.toLowerCase()}-${userId.slice(-6)}`;

    return this.prisma.organization.create({
      data: {
        name: `${userFirstName}'s Workspace`,
        slug,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
    });
  }

  findForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assertMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
    return membership;
  }

  /**
   * Checks the caller has OWNER or ADMIN role - used to gate destructive or
   * structural actions (deleting a project, changing another member's role).
   * Regular MEMBER/VIEWER roles can still read and do everyday work, just
   * not these higher-privilege actions.
   */
  async assertCanManage(userId: string, organizationId: string) {
    const membership = await this.assertMembership(userId, organizationId);
    if (!MANAGE_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'Only organization owners and admins can do this',
      );
    }
    return membership;
  }

  async findOne(userId: string, organizationId: string) {
    await this.assertMembership(userId, organizationId);
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
