import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }
}
