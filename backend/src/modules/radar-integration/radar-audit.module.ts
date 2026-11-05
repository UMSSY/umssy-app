import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarAuditRepository } from './radar-audit.repository.js';

import { RadarAuditService } from './radar-audit.service.js';

@Module({
  imports: [PrismaModule],
  providers: [RadarAuditRepository, RadarAuditService],
  exports: [RadarAuditService],
})
export class RadarAuditModule {}
