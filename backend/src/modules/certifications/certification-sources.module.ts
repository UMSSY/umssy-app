import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { RadarAuditModule } from '../radar-integration/radar-audit.module.js';
import { CertificationSourcesService } from './services/certification-sources.service.js';

import { CertificationRecordsService } from './services/certification-records.service.js';

@Module({
  imports: [PrismaModule, RadarAuditModule],
  providers: [
    CertificationsRepository,
    CertificationRecordsService,
    CertificationSourcesService,
  ],
  exports: [CertificationSourcesService, CertificationRecordsService],
})
export class CertificationSourcesModule {}
