// backend/src/modules/chat/chat.gateway.ts
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../common/services/session.service.js';
import { ChatService } from '../services/chat.service.js';
import { UserPresenceService } from '../services/user-presence.service.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import { MessageService } from '../services/message.service.js';

interface SocketMessagePayload {
  conversationId?: string;
  content?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly chatService: ChatService,
    private readonly userPresenceService: UserPresenceService,
    private readonly eventRoomService: EventRoomService,
    private readonly messageService: MessageService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        console.log(
          '[Socket] Intento de conexión. Token recibido:',
          token ? 'SÍ' : 'NO',
        );

        if (!token) {
          return next(new Error('unauthorized'));
        }

        const payload = await this.jwtService.verifyAsync(token);
        console.log('[Socket] Token válido. Payload:', payload);

        const user = await this.sessionService.getAuthenticatedUser(
          payload.sub,
        );

        if (!user) {
          console.log('[Socket] Usuario no encontrado en la DB');
          return next(new Error('unauthorized'));
        }

        socket.data.user = user;
        console.log('[Socket] Usuario autenticado:', user.id);
        next();
      } catch (error) {
        this.logger.warn(
          `Intento de conexión rechazado: ${error instanceof Error ? error.message : String(error)}`,
        );
        console.log(
          '[Socket] Error en handshake:',
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
      this.logger.error(
        `Error inicializando socket para el usuario ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    try {
      await this.userPresenceService.markOffline(user.id);
      this.server.emit('presence:offline', {
        userId: user.id,
        lastSeenAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        'Error actualizando la presencia del usuario',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Listener for event_room:join
  @SubscribeMessage('event_room:join')
  async handleEventRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string },
  ) {
    try {
      const conversationId = await this.eventRoomService.joinEventRoom(
        client.data.user.id,
        payload.eventId,
      );
      await client.join(conversationId);
      client.emit('event_room:joined', { conversationId });
    } catch (error) {
      if (error instanceof NotRegisteredForEventException) {
        client.emit('event_room:error', { code: 'not_registered' });
      } else {
        client.emit('event_room:error', { code: 'generic_error' });
      }
    }
  }

  // Subscribe message:send
  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SocketMessagePayload,
  ) {
    const user = client.data.user;

    if (
      !user ||
      typeof body?.conversationId !== 'string' ||
      typeof body?.content !== 'string'
    ) {
      return {
        ok: false,
        error: 'Datos del mensaje inválidos',
      };
    }

    try {
      const message = await this.messageService.send({
        conversationId: body.conversationId,
        senderId: user.id,
        content: body.content,
      });

      this.server
        .to(body.conversationId)
        .emit('message:new', message);

      return {
        ok: true,
        message,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar mensaje: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        ok: false,
        error:
          error instanceof Error ? error.message : 'No se pudo enviar el mensaje',
      };
    }
  }
}