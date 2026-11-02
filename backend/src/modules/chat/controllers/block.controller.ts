import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { BlockService } from '../services/block.service.js';
import {
    blockUserIdField,
    blockUserSchema,
    type BlockUserDto,
} from '../requests/block-user.schema.js';
import type { BlockResponse } from '../responses/block.response.js';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat/blocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante', 'mentor', 'empresa')
@UseInterceptors(ResponseInterceptor)
export class BlockController {
    constructor(private readonly blockService: BlockService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Bloquear a un usuario del chat' })
    @ApiBody(toApiBody(blockUserSchema))
    @ApiCreatedResponse({ description: 'Usuario bloqueado: { blockedUserId, createdAt }' })
    @ApiBadRequestResponse({ description: 'Identificador inválido o intento de bloquearse a sí mismo' })
    @ApiNotFoundResponse({ description: 'El usuario a bloquear no existe' })
    @ApiConflictResponse({ description: 'El usuario ya está bloqueado' })
  block(
    @Body(new ZodValidationPipe(blockUserSchema)) body: BlockUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BlockResponse> {
    return this.blockService.block(user.id, body.userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desbloquear a un usuario del chat' })
  @ApiParam({ name: 'userId', description: 'UUID del usuario a desbloquear' })
  @ApiNoContentResponse({ description: 'Usuario desbloqueado' })
  @ApiBadRequestResponse({ description: 'Identificador inválido' })
  @ApiNotFoundResponse({ description: 'No existía un bloqueo para este usuario' })
  async unblock(
    @Param('userId', new ZodValidationPipe(blockUserIdField)) userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.blockService.unblock(user.id, userId);
  }
}