import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { CvFileController } from './controllers/cv-file.controller.js';
import { CvHistoryController } from './controllers/cv-history.controller.js';
import { CvMapper } from './mappers/cv.mapper.js';
import { CvFileRepository } from './repositories/cv-file.repository.js';
import { CvMetadataRepository } from './repositories/cv-metadata.repository.js';
import { CvService } from './services/cv.service.js';
import { CvFileStorage } from './types/cv-file-storage.type.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
  controllers: [CvHistoryController, CvFileController],
  providers: [
    CvService,
    CvMetadataRepository,
    CvMapper,
    FileValidationService,
    CvFileRepository,
    { provide: CvFileStorage, useExisting: CvFileRepository },
  ],
  exports: [CvService],
})
export class CvModule {}
