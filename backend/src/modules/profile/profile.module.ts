import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CV_FILE_STORAGE } from './constants/file-storage.tokens.js';
import { CvFileRepository } from './repositories/cv-file.repository.js';
import { FileValidationService } from './services/file-validation.service.js';

@Module({
  imports: [PrismaModule],
  providers: [
    FileValidationService,
    { provide: CV_FILE_STORAGE, useClass: CvFileRepository },
  ],
  exports: [FileValidationService, CV_FILE_STORAGE],
})
export class ProfileModule {}
