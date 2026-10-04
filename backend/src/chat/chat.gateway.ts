import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface SendMessagePayload {
  organizationId: string;
  userId: string;
  body: string;
}

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join-chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { organizationId: string },
  ) {
    void client.join(`chat:${payload.organizationId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { organizationId: string },
  ) {
    void client.leave(`chat:${payload.organizationId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(@MessageBody() payload: SendMessagePayload) {
    try {
      const message = await this.chatService.createMessage(
        payload.userId,
        payload.organizationId,
        payload.body,
      );
      this.server
        .to(`chat:${payload.organizationId}`)
        .emit('new-message', message);
    } catch (error) {
      this.logger.error(
        'Failed to send chat message',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
