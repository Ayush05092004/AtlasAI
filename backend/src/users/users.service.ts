import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';

const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  jobTitle: true,
  avatarUrl: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        jobTitle:
          dto.jobTitle === undefined ? undefined : dto.jobTitle.trim() || null,
      },
      select: PROFILE_SELECT,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches)
      throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Changing a password signs out every session, so a stolen refresh token stops working.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
