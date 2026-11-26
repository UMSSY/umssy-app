import { MAX_FILE_UPLOAD_SIZE_BYTES } from '../../../common/constants/file-upload.constants.js';
import {
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import { DocumentUploadInterceptor } from '../../access-requests/interceptors/document-upload.interceptor.js';
import { COMPANY_PUBLIC_REQUEST_LIMITS } from '../constants/company-document-correction.constants.js';
import { CompanyDocumentCorrectionUnauthorizedException } from '../exceptions/company-document-correction-unauthorized.exception.js';
import { CompanyDocumentCorrectionGuard } from '../guards/company-document-correction.guard.js';
import { CompanyRequestThrottlerGuard } from '../guards/company-request-throttler.guard.js';
import { CompanyDocumentCorrectionService } from '../services/company-document-correction.service.js';
import type { CompanyDocumentCorrectionRequest } from '../types/company-document-correction.types.js';

@ApiTags('Solicitudes de acceso empresarial')
@Controller('company-access-requests')
export class CompanyDocumentCorrectionController {
  constructor(private readonly correction: CompanyDocumentCorrectionService) {}

  @Post(':code/resubmit')
  @HttpCode(200)
  @UseGuards(CompanyRequestThrottlerGuard, CompanyDocumentCorrectionGuard)
  @Throttle({
    default: {
      limit: COMPANY_PUBLIC_REQUEST_LIMITS.resubmit,
      ttl: COMPANY_PUBLIC_REQUEST_LIMITS.windowMs,
    },
  })
  @UseInterceptors(
    DocumentUploadInterceptor,
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_UPLOAD_SIZE_BYTES },
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'companyAccessRequests_resubmitDocument',
    summary: 'Reenviar el documento de una solicitud observada o rechazada',
    description:
      'Requiere el permiso de corrección enviado en el enlace del correo (cabecera Authorization: Bearer ccr1.…); un JWT de sesión o conocer código y correo no autoriza la operación. El permiso no vence por tiempo y se invalida al confirmar el reemplazo o al cambiar la revisión de la solicitud. Reemplaza la carta, limpia el motivo y devuelve la solicitud a PENDING. Limitado a 10 intentos cada 15 minutos por IP y código (contador en memoria de una sola instancia).',
  })
  @ApiParam({
    name: 'code',
    example: 'EMP-2026-0001',
    description: 'Código de la solicitud que se corrige.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    description: 'Documento registrado y solicitud devuelta a PENDING.',
    schema: {
      type: 'object',
      properties: {
        requestCode: { type: 'string', example: 'EMP-2026-0001' },
        status: { type: 'string', enum: ['PENDING'] },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Archivo ausente, vacío o con un formato no permitido.',
  })
  @ApiPayloadTooLargeResponse({
    description: 'El archivo supera el límite de 10 MB.',
  })
  @ApiUnauthorizedResponse({
    description:
      'No se pudo autorizar la corrección, sin revelar datos de la solicitud.',
  })
  @ApiConflictResponse({
    description:
      'La revisión cambió o otra solicitud activa ya usa el nombre de la empresa, el correo o el usuario (COMPANY_REGISTRATION_CONFLICT con data.field).',
  })
  @ApiTooManyRequestsResponse({
    description: 'Se superó el límite de intentos para esa IP y código.',
  })
  resubmit(
    @Param('code') _code: string,
    @Req() request: CompanyDocumentCorrectionRequest,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    if (!request.companyDocumentCorrection) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }
    return this.correction.resubmit(request.companyDocumentCorrection, file);
  }
}
