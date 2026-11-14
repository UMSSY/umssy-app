import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module.js';
import { DocumentTextExtractorService } from '../access-requests/services/document-text-extractor.service.js';
import { CompanyAccessRequestsController } from './controllers/company-access-requests.controller.js';
import { CompanyAccessRequestsRepository } from './repositories/company-access-requests.repository.js';
import { CompanyAccessRequestsService } from './services/company-access-requests.service.js';

@Module({
  imports: [FilesModule],
  controllers: [CompanyAccessRequestsController],
  providers: [
    CompanyAccessRequestsRepository,
    CompanyAccessRequestsService,
    DocumentTextExtractorService,
  ],
  exports: [CompanyAccessRequestsService],
})
export class CompanyAccessRequestsModule {}