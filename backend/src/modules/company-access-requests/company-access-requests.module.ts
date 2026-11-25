import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CompanyAccessRequestsController } from './controllers/company-access-requests.controller.js';
import { CompanyAccessRequestsRepository } from './repositories/company-access-requests.repository.js';
import { CompanyAccessRequestsService } from './services/company-access-requests.service.js';
import { CompanyDocumentOcrService } from './services/company-document-ocr.service.js';

@Module({
  imports: [FilesModule, JwtAuthModule, NotificationsModule],
  controllers: [CompanyAccessRequestsController],
  providers: [
    CompanyAccessRequestsRepository,
    CompanyAccessRequestsService,
    CompanyDocumentOcrService,
  ],
  exports: [CompanyAccessRequestsService],
})
export class CompanyAccessRequestsModule {}
