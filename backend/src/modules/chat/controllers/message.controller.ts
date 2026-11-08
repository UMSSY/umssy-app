import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MessageService } from '../services/message.service.js';
import { conversationIdField } from '../requests/chat-fields.schema.js';
import { ChatGateway } from '../gateways/chat.gateway.js';
import {
  sendMessageSchema,
  type SendMessageDto,
} from '../requests/send-message.schema.js';
import {
  getMessagesQuerySchema,
  type GetMessagesQuery,
} from '../requests/get-messages.schema.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante', 'mentor', 'empresa')
@UseInterceptors(ResponseInterceptor)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('chat/messages')
  async send(
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const message = await this.messageService.send({
      conversationId: body.conversationId,
      senderId: user.id,
      content: body.content,
    });

    this.chatGateway.broadcastMessage(message);

    return message;
  }

  @Get('chat/conversations/:conversationId/messages/page')
  getPage(
    @Param('conversationId', new ZodValidationPipe(conversationIdField)) conversationId: string,
    @Query(new ZodValidationPipe(getMessagesQuerySchema.omit({ conversationId: true })))
    query: Omit<GetMessagesQuery, 'conversationId'>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messageService.getPage({
      conversationId,
      userId: user.id,
      cursor: query.cursor ?? null,
      limit: query.limit,
    });
  }

  @Patch('chat/conversations/:conversationId/read-state')
  async markRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.messageService.markRead(conversationId, user.id);
    return { conversationId, readAt: new Date().toISOString() };
  }
}