import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { RadarAuditModule } from '../radar-integration/radar-audit.module.js';
import { CertificationSourcesService } from './services/certification-sources.service.js';

@Module({
  imports: [PrismaModule, RadarAuditModule],
  providers: [CertificationsRepository, CertificationSourcesService],
  exports: [CertificationSourcesService],
})
export class CertificationSourcesModule {}
