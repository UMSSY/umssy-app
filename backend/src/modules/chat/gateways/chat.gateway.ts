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
import { MessageService } from '../services/message.service.js';
import { EventRoomService } from '../services/event-room.service.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import type {
  SocketMessagePayload,
  EventRoomJoinPayload,
} from '../types/chat-gateway.types.js';

@WebSocketGateway({
  namespace: '/chat',
  path: '/api/socket.io',
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
    private readonly messageService: MessageService,
    private readonly eventRoomService: EventRoomService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next: (error?: Error) => void) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return next(new Error('unauthorized'));
        }

        const payload = await this.jwtService.verifyAsync(token);
        const user = await this.sessionService.getAuthenticatedUser(
          payload.sub,
        );

        if (!user) {
          return next(new Error('unauthorized'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        this.logger.warn(
          `Intento de conexión rechazado: ${
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
      const conversationIds = await this.chatService.getActiveConversationIds(
        user.id,
      );

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

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SocketMessagePayload,
  ) {
    const user = client.data.user;

    if (!user || typeof body?.conversationId !== 'string') {
      return {
        ok: false,
        error: 'Datos de conversación inválidos',
      };
    }

    try {
      const conversationIds = await this.chatService.getActiveConversationIds(
        user.id,
      );

      if (!conversationIds.includes(body.conversationId)) {
        return {
          ok: false,
          error: 'No tienes acceso a esta conversación',
        };
      }

      await client.join(body.conversationId);
      return { ok: true };
    } catch (error) {
      this.logger.error(
        'Error al unirse a la conversación',
        error instanceof Error ? error.stack : String(error),
      );

      return {
        ok: false,
        error: 'No se pudo abrir la conversación',
      };
    }
  }

  @SubscribeMessage('event_room:join')
  async handleEventRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EventRoomJoinPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.eventId !== 'string') {
      return {
        ok: false,
        error: 'Identificador de evento inválido',
      };
    }

    try {
      const conversationId = await this.eventRoomService.joinEventRoom(
        user.id,
        payload.eventId,
      );
      await client.join(conversationId);
      client.emit('event_room:joined', { conversationId });
      return { ok: true, conversationId };
    } catch (error) {
      if (error instanceof NotRegisteredForEventException) {
        client.emit('event_room:error', { code: 'not_registered' });
      } else {
        client.emit('event_room:error', { code: 'generic_error' });
      }
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Error al unirse a la sala',
      };
    }
  }

  @SubscribeMessage('message:send')
  async sendMessage(
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

      this.server.to(body.conversationId).emit('message:new', message);

      return {
        ok: true,
        message,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar mensaje: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo enviar el mensaje',
      };
    }
  }
}
