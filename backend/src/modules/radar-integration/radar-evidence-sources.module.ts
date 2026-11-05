import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarEvidenceSourcesRepository } from './radar-evidence-sources.repository.js';

@Module({ imports: [PrismaModule], providers: [RadarEvidenceSourcesRepository], exports: [RadarEvidenceSourcesRepository] })
export class RadarEvidenceSourcesModule {}
