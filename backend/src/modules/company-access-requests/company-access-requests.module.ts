import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CompanyDocumentCorrectionController } from './controllers/company-document-correction.controller.js';
import { COMPANY_PUBLIC_REQUEST_LIMITS } from './constants/company-document-correction.constants.js';
import { CompanyDocumentCorrectionGuard } from './guards/company-document-correction.guard.js';
import { CompanyRequestThrottlerGuard } from './guards/company-request-throttler.guard.js';
import { CompanyDocumentCorrectionAuthorizationService } from './services/company-document-correction-authorization.service.js';
import { CompanyDocumentCorrectionService } from './services/company-document-correction.service.js';
import { CompanyAccessRequestsController } from './controllers/company-access-requests.controller.js';
import { CompanyAccessRequestsRepository } from './repositories/company-access-requests.repository.js';
import { CompanyAccessRequestsService } from './services/company-access-requests.service.js';
import { CompanyDocumentOcrService } from './services/company-document-ocr.service.js';

@Module({
  imports: [
    FilesModule,
    JwtAuthModule,
    NotificationsModule,
    ThrottlerModule.forRoot([
      {
        ttl: COMPANY_PUBLIC_REQUEST_LIMITS.windowMs,
        limit: COMPANY_PUBLIC_REQUEST_LIMITS.resubmit,
      },
    ]),
  ],
  controllers: [
    CompanyAccessRequestsController,
    CompanyDocumentCorrectionController,
  ],
  providers: [
    CompanyAccessRequestsRepository,
    CompanyAccessRequestsService,
    CompanyDocumentOcrService,
    CompanyDocumentCorrectionAuthorizationService,
    CompanyDocumentCorrectionService,
    CompanyDocumentCorrectionGuard,
    CompanyRequestThrottlerGuard,
  ],
  exports: [CompanyAccessRequestsService],
})
export class CompanyAccessRequestsModule {}
