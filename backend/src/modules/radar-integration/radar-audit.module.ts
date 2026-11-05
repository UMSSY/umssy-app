import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarAuditRepository } from './radar-audit.repository.js';

@Module({ imports: [PrismaModule], providers: [RadarAuditRepository], exports: [RadarAuditRepository] })
export class RadarAuditModule {}
