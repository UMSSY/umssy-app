import { CvSourcesModule } from '../cv/cv-sources.module.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarEvidenceSourcesRepository } from './repositories/radar-evidence-sources.repository.js';
import { RadarEvidenceSourcesService } from './services/radar-evidence-sources.service.js';

@Module({
  imports: [PrismaModule, CvSourcesModule],
  providers: [RadarEvidenceSourcesRepository, RadarEvidenceSourcesService],
  exports: [RadarEvidenceSourcesService],
})
export class RadarEvidenceSourcesModule {}
