import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import {
  ATTACHMENT_FIELD_NAME,
  MAX_ATTACHMENT_UPLOAD_SIZE_BYTES,
} from '../constants/attachment.constants.js';
import { AttachmentUploadInterceptor } from '../interceptors/attachment-upload.interceptor.js';
import {
  sendAttachmentMessageSchema,
  type SendAttachmentMessageDto,
} from '../requests/send-attachment-message.schema.js';
import { AttachmentService } from '../services/attachment.service.js';
import type { AttachmentResponse } from '../responses/attachment.response.js';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante', 'mentor', 'empresa')
@UseInterceptors(ResponseInterceptor)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('messages/attachment')
  @ApiOperation({ summary: 'Enviar mensaje con archivo adjunto (JPG, PNG o PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        conversationId: {
          type: 'string',
          format: 'uuid',
        },
        content: {
          type: 'string',
        },
      },
      required: ['file', 'conversationId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Mensaje con archivo adjunto enviado correctamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o tamaño excedido' })
  @ApiResponse({ status: 403, description: 'No pertenece a la conversación' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  @UseInterceptors(
    AttachmentUploadInterceptor,
    FileInterceptor(ATTACHMENT_FIELD_NAME, {
      limits: {
        fileSize: MAX_ATTACHMENT_UPLOAD_SIZE_BYTES,
      },
    }),
  )
  uploadAndSend(
    @CurrentUserId() userId: string,
    @UploadedFile() file: MulterFile | undefined,
    @Body(new ZodValidationPipe(sendAttachmentMessageSchema))
    body: SendAttachmentMessageDto,
  ) {
    return this.attachmentService.uploadAndSend(userId, file, body);
  }

  @Post('attachments')
  @UseInterceptors(
    AttachmentUploadInterceptor,
    FileInterceptor(ATTACHMENT_FIELD_NAME, {
      limits: {
        fileSize: MAX_ATTACHMENT_UPLOAD_SIZE_BYTES,
      },
    }),
  )
  uploadAndSendAlias(
    @CurrentUserId() userId: string,
    @UploadedFile() file: MulterFile | undefined,
    @Body(new ZodValidationPipe(sendAttachmentMessageSchema))
    body: SendAttachmentMessageDto,
  ) {
    return this.attachmentService.uploadAndSend(userId, file, body);
  }

  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Descargar archivo adjunto con control de acceso por conversación' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID del archivo adjunto' })
  @ApiResponse({ status: 200, description: 'Stream binario del archivo' })
  @ApiResponse({ status: 403, description: 'No pertenece a la conversación del archivo' })
  @ApiResponse({ status: 404, description: 'Archivo adjunto no encontrado' })
  async download(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const download = await this.attachmentService.getDownload(userId, id);

    return new StreamableFile(download.content, {
      type: download.mimeType,
      disposition: `inline; filename="${download.fileName}"`,
      length: download.content.length,
    });
  }

  @Get('attachments/:id')
  @ApiOperation({ summary: 'Obtener metadatos de un archivo adjunto' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID del archivo adjunto' })
  @ApiResponse({ status: 200, description: 'Metadatos del archivo adjunto' })
  @ApiResponse({ status: 404, description: 'Archivo adjunto no encontrado' })
  async getById(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttachmentResponse> {
    return this.attachmentService.getById(userId, id);
  }
}
