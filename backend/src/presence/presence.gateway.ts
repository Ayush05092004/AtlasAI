import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ViewerInfo {
  userId: string;
  firstName: string;
  lastName: string;
}

interface JoinProjectPayload {
  projectId: string;
  user: ViewerInfo;
}

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  // Maps each socket connection to which project room it's in and who they are,
  // so we know what to clean up when they disconnect.
  private socketInfo = new Map<
    string,
    { projectId: string; user: ViewerInfo }
  >();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const info = this.socketInfo.get(client.id);
    if (info) {
      this.socketInfo.delete(client.id);
      this.broadcastViewers(info.projectId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinProjectPayload,
  ) {
    void client.join(`project:${payload.projectId}`);
    this.socketInfo.set(client.id, {
      projectId: payload.projectId,
      user: payload.user,
    });
    this.broadcastViewers(payload.projectId);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: string },
  ) {
    void client.leave(`project:${payload.projectId}`);
    this.socketInfo.delete(client.id);
    this.broadcastViewers(payload.projectId);
  }

  private broadcastViewers(projectId: string) {
    const viewers = Array.from(this.socketInfo.values())
      .filter((info) => info.projectId === projectId)
      .map((info) => info.user);

    // De-duplicate by userId - the same person could have multiple tabs/sockets open.
    const uniqueViewers = Array.from(
      new Map(viewers.map((v) => [v.userId, v])).values(),
    );

    this.server
      .to(`project:${projectId}`)
      .emit('viewers-updated', uniqueViewers);
  }
}
