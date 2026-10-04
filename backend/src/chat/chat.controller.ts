import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizations/:organizationId/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages')
  getMessages(
    @CurrentUser() user: { userId: string; email: string },
    @Param('organizationId') organizationId: string,
  ) {
    return this.chatService.getMessages(user.userId, organizationId);
  }
}
