import { forwardRef, Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CertificationDocumentsModule } from '../certification-documents/certification-documents.module.js';
import { CertificationsController } from './controllers/certifications.controller.js';
import { CertificationSaveController } from './controllers/certification-save.controller.js';
import { CertificationMapper } from './mappers/certification.mapper.js';
import { CertificationsService } from './services/certifications.service.js';
import { NlpModule } from '../nlp/nlp.module.js';
import { CertificationSourcesModule } from './certification-sources.module.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { RadarAuditModule } from '../radar-integration/radar-audit.module.js';

@Module({
  imports: [
    PrismaModule,
    CertificationSourcesModule,
    RadarAuditModule,
    JwtAuthModule,
    forwardRef(() => CertificationDocumentsModule),
    NlpModule,
  ],
  controllers: [CertificationsController, CertificationSaveController],
  providers: [
    CertificationsService,
    CertificationsRepository,
    CertificationMapper,
  ],
  exports: [CertificationSourcesModule, CertificationMapper],
})
export class CertificationsModule {}
