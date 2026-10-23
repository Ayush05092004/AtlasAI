import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/users.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string }) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { userId: string; email: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: { userId: string; email: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
