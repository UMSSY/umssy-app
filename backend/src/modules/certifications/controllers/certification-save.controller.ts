import { Body, Controller, Param, ParseUUIDPipe, Patch, Post, StandardSchemaValidationPipe, UploadedFile, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { CERTIFICATION_DOCUMENT_FIELD_NAME, CERTIFICATION_DOCUMENT_UPLOAD_LIMIT_BYTES } from '../../certification-documents/constants/certification-document.constants.js';
import { saveCertificationDocumentSchema, type SaveCertificationDocumentRequest } from '../requests/save-certification-document.request.js';
import { CertificationsService } from '../services/certifications.service.js';

const saveBody: Parameters<typeof ApiBody>[0] = { schema: {
  type: 'object', required: ['name', 'issuingOrganization', 'issueDate', 'documentAction'],
  properties: {
    name: { type: 'string', maxLength: 150 },
    issuingOrganization: { type: 'string', maxLength: 100 },
    issueDate: { type: 'string', format: 'date' },
    documentAction: { type: 'string', enum: ['replace', 'remove', 'keep'], description: 'replace requires file; a new certification requires replace.' },
    file: { type: 'string', format: 'binary' },
  },
} };

@ApiTags('certifications')
@ApiBearerAuth()
@Controller('certifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@UsePipes(new StandardSchemaValidationPipe({ exceptionFactory: buildRequestValidationException }))
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor(CERTIFICATION_DOCUMENT_FIELD_NAME, { limits: { fileSize: CERTIFICATION_DOCUMENT_UPLOAD_LIMIT_BYTES, files: 1 } }))
export class CertificationSaveController {
  constructor(private readonly service: CertificationsService) {}

  @Post('with-document')
  @ApiBody(saveBody)
  create(@CurrentUserId() userId: string, @Body({ schema: saveCertificationDocumentSchema }) body: SaveCertificationDocumentRequest, @UploadedFile() file: MulterFile | undefined) {
    const { documentAction, ...request } = body;
    return this.service.saveWithDocument(userId, null, request, documentAction, file);
  }

  @Patch(':id/with-document')
  @ApiBody(saveBody)
  update(@CurrentUserId() userId: string, @Param('id', new ParseUUIDPipe()) id: string, @Body({ schema: saveCertificationDocumentSchema }) body: SaveCertificationDocumentRequest, @UploadedFile() file: MulterFile | undefined) {
    const { documentAction, ...request } = body;
    return this.service.saveWithDocument(userId, id, request, documentAction, file);
  }
}
