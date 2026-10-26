// backend/src/modules/chat/chat.gateway.ts
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../common/services/session.service.js';
import { ChatService } from '../services/chat.service.js';
import { UserPresenceService } from '../services/user-presence.service.js';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*', 
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly chatService: ChatService,
    private readonly userPresenceService: UserPresenceService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        console.log("[Socket] Intento de conexión. Token recibido:", token ? "SÍ" : "NO");

        if (!token) {
          return next(new Error('unauthorized'));
        }

        const payload = await this.jwtService.verifyAsync(token);
        console.log("[Socket] Token válido. Payload:", payload);

        const user = await this.sessionService.getAuthenticatedUser(payload.sub);
        if (!user) {
            console.log("[Socket] Usuario no encontrado en la DB");
          return next(new Error('unauthorized'));
        }

        socket.data.user = user;
        console.log("[Socket] Usuario autenticado:", user.id);
        next();
      } catch (error) {
        this.logger.warn(
          `Intento de conexión rechazado: ${error instanceof Error ? error.message : String(error)}`,
        );
        console.log(
          "[Socket] Error en handshake:",
          error instanceof Error ? error.message : String(error),
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
      const conversationIds = await this.chatService.getActiveConversationIds(user.id);
      for (const convId of conversationIds) {
        await client.join(convId);
      }

      await this.userPresenceService.markOnline(user.id);
      
     
      this.server.emit('presence:online', { userId: user.id });

    } catch (error) {
      this.logger.error(`Error inicializando socket para el usuario ${user.id}`, error);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    
    await this.userPresenceService.markOffline(user.id);
    this.server.emit('presence:offline', { userId: user.id, lastSeenAt: new Date() });
  }
}