import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import { CertificationsModule } from '../certifications.module.js';
import { CertificationsController } from '../controllers/certifications.controller.js';
import { CertificationDocumentsController } from '../controllers/certification-documents.controller.js';
import { CertificationDocumentFileController } from '../controllers/certification-document-file.controller.js';
import { CertificationsService } from '../services/certifications.service.js';
import { CertificationDocumentsService } from '../services/certification-documents.service.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';
import { CertificationDocumentsRepository } from '../repositories/certification-documents.repository.js';
import { CertificationMapper } from '../mappers/certification.mapper.js';
import { CertificationDocumentMapper } from '../mappers/certification-document.mapper.js';

describe('CertificationsModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CertificationsModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it.each([
    CertificationsController,
    CertificationDocumentsController,
    CertificationDocumentFileController,
    CertificationsService,
    CertificationDocumentsService,
    CertificationsRepository,
    CertificationDocumentsRepository,
    CertificationMapper,
    CertificationDocumentMapper,
    FileValidationService,
  ])('provides %p', (provider) => {
    expect(moduleRef.get(provider)).toBeDefined();
  });
});
