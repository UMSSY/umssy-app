import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { CvFileController } from './controllers/cv-file.controller.js';
import { CvHistoryController } from './controllers/cv-history.controller.js';
import { CvMapper } from './mappers/cv.mapper.js';
import { CvSourcesModule } from './cv-sources.module.js';
import { CvMetadataRepository } from './repositories/cv-metadata.repository.js';
import { CvPdfGeneratorService } from './services/cv-pdf-generator.service.js';
import { CvService } from './services/cv.service.js';
import { RadarIntegrationModule } from '../radar-integration/radar-integration.module.js';

@Module({
  imports: [
    CvSourcesModule,
    PrismaModule,
    JwtAuthModule,
    RadarIntegrationModule,
  ],
  controllers: [CvHistoryController, CvFileController],
  providers: [
    CvService,
    CvMetadataRepository,
    CvMapper,
    FileValidationService,
    CvPdfGeneratorService,
  ],
  exports: [CvService, CvPdfGeneratorService],
})
export class CvModule {}
