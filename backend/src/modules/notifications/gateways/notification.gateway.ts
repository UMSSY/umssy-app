import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../common/services/session.service.js';

@WebSocketGateway({
  namespace: '/notifications',
  path: '/api/socket.io',
  cors: { origin: '*' },
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next: (error?: Error) => void) => {
      try {
        const token = socket.handshake.auth?.token;
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

  emitToUser(userId: string, event: string, payload: unknown): void {
    const room = `user:${userId}`;
    this.logger.log(`[Socket/Notifications] Enviando ${event} al usuario ${userId}`);
    this.server.to(room).emit(event, payload);
  }
}