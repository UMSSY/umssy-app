import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarEvidenceSourcesRepository } from './radar-evidence-sources.repository.js';
import { RadarEvidenceSourcesService } from './services/radar-evidence-sources.service.js';

@Module({
  imports: [PrismaModule],
  providers: [RadarEvidenceSourcesRepository, RadarEvidenceSourcesService],
  exports: [RadarEvidenceSourcesService],
})
export class RadarEvidenceSourcesModule {}
