import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

const MANAGE_ROLES = ['OWNER', 'ADMIN'];
const INVITE_TTL_DAYS = 7;

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

  async getMembers(userId: string, organizationId: string) {
    await this.assertMembership(userId, organizationId);
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createInvite(
    userId: string,
    organizationId: string,
    email: string,
    role: string,
  ) {
    await this.assertCanManage(userId, organizationId);

    const existingMember = await this.prisma.organizationMember.findFirst({
      where: { organizationId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException(
        'This person is already a member of the organization',
      );
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    return this.prisma.organizationInvite.create({
      data: {
        organizationId,
        email,
        role: role as 'ADMIN' | 'MEMBER' | 'VIEWER',
        token,
        invitedById: userId,
        expiresAt,
      },
    });
  }

  async getPendingInvites(userId: string, organizationId: string) {
    await this.assertMembership(userId, organizationId);
    return this.prisma.organizationInvite.findMany({
      where: { organizationId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(userId: string, organizationId: string, inviteId: string) {
    await this.assertCanManage(userId, organizationId);
    const invite = await this.prisma.organizationInvite.findFirst({
      where: { id: inviteId, organizationId },
    });
    if (!invite) throw new NotFoundException('Invite not found');

    await this.prisma.organizationInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
    return { success: true };
  }

  /** Called when someone clicks an invite link and is logged in (or just registered). */
  async acceptInvite(userId: string, userEmail: string, token: string) {
    const invite = await this.prisma.organizationInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundException(
        'This invite is invalid or has already been used',
      );
    }
    if (invite.expiresAt < new Date()) {
      throw new ForbiddenException('This invite has expired');
    }
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    const alreadyMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId,
        },
      },
    });
    if (alreadyMember) {
      await this.prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
      return this.prisma.organization.findUnique({
        where: { id: invite.organizationId },
      });
    }

    await this.prisma.$transaction([
      this.prisma.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
        },
      }),
      this.prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return this.prisma.organization.findUnique({
      where: { id: invite.organizationId },
    });
  }
}
