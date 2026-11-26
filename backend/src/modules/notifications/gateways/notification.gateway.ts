import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../common/services/session.service.js';
import { SOCKET_CORS_CONFIG } from '../../../common/utils/cors-origins.js';
import { extractSocketAccessToken } from '../../../common/utils/extract-socket-access-token.js';
import { VisibilityChangedSchema } from '../requests/visibility-changed.schema.js';
import { AppVisibilityService } from '../services/app-visibility.service.js';

@WebSocketGateway({
  namespace: '/notifications',
  path: '/api/socket.io',
  cors: SOCKET_CORS_CONFIG,
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly appVisibilityService: AppVisibilityService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next: (error?: Error) => void) => {
      try {
        const token = extractSocketAccessToken(socket.handshake);
        if (!token) return next(new Error('unauthorized'));

        const payload = await this.jwtService.verifyAsync(token);
        const user = await this.sessionService.getAuthenticatedUser(payload.sub);

        if (!user) return next(new Error('unauthorized'));

        socket.data.user = user;
        next();
      } catch (error) {
        this.logger.warn(
          `Intento de conexión rechazado en /notifications: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        next(new Error('unauthorized'));
      }
    });
  }

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    try {
      await client.join(`user:${user.id}`);
      this.logger.log(`Usuario ${user.id} conectado a /notifications`);
    } catch (error) {
      this.logger.error(
        `Error inicializando socket de notificaciones para ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user;
    if (!user) return;

    this.appVisibilityService.removeConnection(user.id, client.id);
  }

  @SubscribeMessage('visibility:changed')
  handleVisibilityChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): void {
    const user = client.data.user;
    if (!user) return;

    const parsed = VisibilityChangedSchema.safeParse(body);
    if (!parsed.success) return;

    this.appVisibilityService.setVisibility(
      user.id,
      client.id,
      parsed.data.visible,
    );
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    const room = `user:${userId}`;
    this.logger.log(`[Socket/Notifications] Enviando ${event} al usuario ${userId}`);
    this.server.to(room).emit(event, payload);
  }
}
