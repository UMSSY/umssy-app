import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

import {
  sendConnectionRequestSchema,
  type SendConnectionRequestDto,
} from '../requests/send-connection-request.schema.js';
import { ConnectionRequestService } from '../services/connection-request.service.js';

@Controller('chat/connection-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante', 'mentor', 'empresa')
@UseInterceptors(ResponseInterceptor)
export class ConnectionRequestController {
  constructor(
    private readonly connectionRequestService: ConnectionRequestService,
  ) {}

  @Post()
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(sendConnectionRequestSchema))
    body: SendConnectionRequestDto,
  ) {
    return this.connectionRequestService.send(user.id, body.receiverId);
  }

  @Get('sent')
  findSent(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionRequestService.findSent(user.id);
  }

  @Get('received')
  findReceived(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionRequestService.findReceived(user.id);
  }

  @Patch(':id/accept')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') requestId: string,
  ) {
    return this.connectionRequestService.accept(requestId, user.id);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') requestId: string,
  ) {
    return this.connectionRequestService.reject(requestId, user.id);
  }
}
