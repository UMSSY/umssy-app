import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarAuditModule } from '../radar-integration/radar-audit.module.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { CertificationAnalysisSourcesService } from './services/certification-analysis-sources.service.js';

@Module({
  imports: [PrismaModule, RadarAuditModule],
  providers: [CertificationsRepository, CertificationAnalysisSourcesService],
  exports: [CertificationsRepository, CertificationAnalysisSourcesService],
})
export class CertificationSourcesModule {}
