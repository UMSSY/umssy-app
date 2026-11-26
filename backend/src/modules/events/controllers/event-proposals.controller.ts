import {
  Body,
  applyDecorators,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { GetEventIdSchema } from '../requests/get-event-id.request.js';
import { EventProposalsService } from '../services/event-proposals.service.js';
import {
  EVENT_PROPOSAL_BODY,
  EVENT_PROPOSAL_CREATED,
  EVENT_PROPOSAL_ERRORS,
} from '../constants/event-proposal-swagger.constants.js';

@ApiTags('Event proposals')
@Controller()
export class EventProposalsController {
  constructor(private readonly proposals: EventProposalsService) {}

  @Post('event-proposals')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    operationId: 'createEventProposal',
    summary: 'Proponer un taller',
    description:
      'Requiere titulado activo. Admite una sesión principal y hasta 19 adicionales, todas en horario de Bolivia.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'UUID de la solicitud; reutilizarlo con el mismo contenido devuelve la misma propuesta.',
    schema: { type: 'string', format: 'uuid' },
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiBody(EVENT_PROPOSAL_BODY)
  @ApiResponse(EVENT_PROPOSAL_CREATED)
  @applyDecorators(
    ...EVENT_PROPOSAL_ERRORS.map((options) => ApiResponse(options)),
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('titulado')
  @UseInterceptors(
    FileInterceptor('cover', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 10,
        fieldSize: 10000,
      },
    }),
  )
  create(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
    @UploadedFile() file: MulterFile | undefined,
    @Headers('idempotency-key') key: string | undefined,
  ) {
    return this.proposals.create(userId, body, file, key);
  }

  @Get('events/:id/cover')
  async cover(
    @Param('id', new ZodValidationPipe(GetEventIdSchema)) id: string,
  ) {
    const image = await this.proposals.cover(id);
    return new StreamableFile(image.content, {
      type: image.mimeType,
      disposition: 'inline',
      length: image.content.length,
    });
  }
}
