import { Body, Controller, HttpCode, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { MAX_FILE_SIZE_BYTES } from '../../files/constants/file-rules.constants.js';
import { DocumentCorrectionUnauthorizedException } from '../exceptions/document-correction-unauthorized.exception.js';
import { DocumentCorrectionGuard } from '../guards/document-correction.guard.js';
import { DocumentUploadInterceptor } from '../interceptors/document-upload.interceptor.js';
import { attachDocumentSchema, type AttachDocumentDto } from '../requests/attach-document.schema.js';
import { DocumentCorrectionService } from '../services/document-correction.service.js';
import { ACCESS_REQUEST_DOCUMENT_TYPE } from '../types/access-request.enum.js';
import type { DocumentCorrectionRequest } from '../types/document-correction-request.types.js';
import type { UploadedDocumentFile } from '../types/uploaded-file.types.js';

@Controller('access-requests')
export class DocumentCorrectionController {
  constructor(private readonly correction: DocumentCorrectionService) {}

  @Post(':code/resubmit')
  @HttpCode(200)
  @UseGuards(DocumentCorrectionGuard)
  @UseInterceptors(DocumentUploadInterceptor, FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reenviar el documento de una solicitud rechazada',
    description: 'Requiere el permiso específico de corrección entregado por B3; un JWT de sesión o conocer código y correo no autoriza esta operación. El permiso no vence por tiempo y se invalida al confirmar el reemplazo o cambiar la revisión de la solicitud.',
  })
  @ApiParam({ name: 'code', example: 'SOL-2026-0001', description: 'Código de la misma solicitud que se corrige.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string', enum: Object.values(ACCESS_REQUEST_DOCUMENT_TYPE) },
      },
    },
  })
  @ApiOkResponse({
    description: 'Documento registrado en la misma solicitud y estado actualizado a pendiente.',
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'detail', 'data'],
      properties: {
        statusCode: { type: 'integer', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string', example: 'Operación exitosa' },
        data: {
          type: 'object', required: ['requestCode', 'status'],
          properties: { requestCode: { type: 'string' }, status: { type: 'string', enum: ['pending'] } },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Archivo ausente, vacío, inválido o tipo documental no permitido.' })
  @ApiPayloadTooLargeResponse({ description: 'El archivo supera el límite de 10 MB.' })
  @ApiUnauthorizedResponse({ description: 'No se pudo autorizar la corrección, sin revelar datos de la solicitud.' })
  @ApiConflictResponse({ description: 'La revisión cambió o existe otra solicitud activa con los mismos datos.' })
  resubmit(
    @Req() request: DocumentCorrectionRequest,
    @UploadedFile() file: UploadedDocumentFile | undefined,
    @Body(new ZodValidationPipe(attachDocumentSchema)) body: AttachDocumentDto,
  ) {
    if (!request.documentCorrection) throw new DocumentCorrectionUnauthorizedException();
    return this.correction.resubmit(request.documentCorrection, { file, documentType: body.documentType });
  }
}
