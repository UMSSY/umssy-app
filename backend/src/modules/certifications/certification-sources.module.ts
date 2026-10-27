import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { RadarAuditModule } from '../radar-integration/radar-audit.module.js';

// Read access without importing the mutation service (which triggers NLP).
@Module({ imports: [PrismaModule, RadarAuditModule], providers: [CertificationsRepository], exports: [CertificationsRepository] })
export class CertificationSourcesModule {}
