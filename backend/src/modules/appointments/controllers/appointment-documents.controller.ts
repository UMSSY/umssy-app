import {
  Controller,
  Get,
  Param,
  Post,
  StreamableFile,
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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import {
  APPOINTMENT_DOCUMENT_RESPONSE_SCHEMA,
  APPOINTMENT_MESSAGES,
  DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS,
  FIND_APPOINTMENT_DOCS,
  UPLOAD_APPOINTMENT_DOCUMENT_DOCS,
} from '../constants/appointment-docs.constants.js';
import { APPOINTMENT_DOCUMENT_UPLOAD_LIMIT_BYTES } from '../constants/appointment-document.constants.js';
import { appointmentIdSchema } from '../requests/appointment-id.request.js';
import { AppointmentDocumentsService } from '../services/appointment-documents.service.js';
import type { AppointmentDocumentResponse } from '../types/appointment-document-response.types.js';

@Controller('appointments/:id/document')
@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('mentor', 'titulado', 'estudiante')
@ApiParam({
  name: 'id',
  format: 'uuid',
  description: FIND_APPOINTMENT_DOCS.idDescription,
})
@ApiUnauthorizedResponse({
  description: APPOINTMENT_MESSAGES.unauthorizedSession,
})
export class AppointmentDocumentsController {
  constructor(
    private readonly appointmentDocumentsService: AppointmentDocumentsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: APPOINTMENT_DOCUMENT_UPLOAD_LIMIT_BYTES, files: 1 },
    }),
  )
  @ApiOperation({
    summary: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.summary,
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.description,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        ['file']: {
          type: 'string',
          format: 'binary',
          description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.fileDescription,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.createdDescription,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 201 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string' },
        data: APPOINTMENT_DOCUMENT_RESPONSE_SCHEMA,
      },
    },
  })
  @ApiBadRequestResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.badRequestDescription,
  })
  @ApiForbiddenResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.forbiddenDescription,
  })
  @ApiNotFoundResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.notFoundDescription,
  })
  @ApiConflictResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.conflictDescription,
  })
  @ApiPayloadTooLargeResponse({
    description: UPLOAD_APPOINTMENT_DOCUMENT_DOCS.payloadTooLargeDescription,
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      UPLOAD_APPOINTMENT_DOCUMENT_DOCS.unsupportedMediaTypeDescription,
  })
  upload(
    @CurrentUserId() userId: string,
    @Param('id', new RequestValidationPipe(appointmentIdSchema)) id: string,
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<AppointmentDocumentResponse> {
    return this.appointmentDocumentsService.upload(userId, id, file);
  }

  @Get()
  @ApiOperation({
    summary: DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS.summary,
    description: DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS.description,
  })
  @ApiProduces('application/pdf', 'image/png', 'image/jpeg')
  @ApiOkResponse({
    description: DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS.okDescription,
    schema: { type: 'string', format: 'binary' },
  })
  @ApiForbiddenResponse({
    description: DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS.forbiddenDescription,
  })
  @ApiNotFoundResponse({
    description: DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS.notFoundDescription,
  })
  async download(
    @CurrentUserId() userId: string,
    @Param('id', new RequestValidationPipe(appointmentIdSchema)) id: string,
  ): Promise<StreamableFile> {
    const document = await this.appointmentDocumentsService.download(
      userId,
      id,
    );

    return new StreamableFile(document.content, {
      type: document.mimeType,
      disposition: document.contentDisposition,
      length: document.content.length,
    });
  }
}
