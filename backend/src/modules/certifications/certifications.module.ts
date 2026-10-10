import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { CertificationDocumentFileController } from './controllers/certification-document-file.controller.js';
import { CertificationDocumentsController } from './controllers/certification-documents.controller.js';
import { CertificationsController } from './controllers/certifications.controller.js';
import { CertificationDocumentMapper } from './mappers/certification-document.mapper.js';
import { CertificationMapper } from './mappers/certification.mapper.js';
import { CertificationDocumentsRepository } from './repositories/certification-documents.repository.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { CertificationDocumentsService } from './services/certification-documents.service.js';
import { CertificationsService } from './services/certifications.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
  controllers: [
    CertificationsController,
    CertificationDocumentsController,
    CertificationDocumentFileController,
  ],
  providers: [
    CertificationsService,
    CertificationDocumentsService,
    CertificationsRepository,
    CertificationDocumentsRepository,
    CertificationMapper,
    CertificationDocumentMapper,
    FileValidationService,
  ],
  exports: [
    CertificationsService,
    CertificationDocumentsService,
    CertificationsRepository,
    CertificationDocumentsRepository,
    CertificationMapper,
  ],
})
export class CertificationsModule {}
