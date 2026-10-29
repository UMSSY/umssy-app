import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditEventsModule } from '../audit-events/audit-events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AccessRequestsController } from './controllers/access-requests.controller.js';
import { AccessRequestAutomationController } from './controllers/access-request-automation.controller.js';
import { AccountActivationController } from './controllers/account-activation.controller.js';
import { AccessRequestsService } from './services/access-requests.service.js';
import { AccountActivationService } from './services/account-activation.service.js';
import { AccessRequestsRepository } from './repositories/access-requests.repository.js';
import { AccountActivationRepository } from './repositories/account-activation.repository.js';
import { ActivationOtpRepository } from './repositories/activation-otp.repository.js';
import { RejectionNotificationService } from './services/rejection-notification.service.js';
import { ActivationOtpService } from './services/activation-otp.service.js';
import { MailServiceSender } from './mail/mail-service-sender.js';
import { MAIL_SENDER } from './mail/mail-sender.js';
import { RejectionMailContextService } from './mail/rejection-mail-context.service.js';
import { RejectionMailLinkService } from './services/rejection-mail-link.service.js';
import { RejectionMailRepository } from './repositories/rejection-mail.repository.js';
import { DocumentValidationRepository } from './repositories/document-validation.repository.js';
import { AutomaticValidationService } from './services/automatic-validation.service.js';
import { DocumentCorrectionController } from './controllers/document-correction.controller.js';
import { DocumentCorrectionGuard } from './guards/document-correction.guard.js';
import { DocumentCorrectionRepository } from './repositories/document-correction.repository.js';
import { DocumentCorrectionAuthorizationService } from './services/document-correction-authorization.service.js';
import { DocumentCorrectionService } from './services/document-correction.service.js';

@Module({
  imports: [ConfigModule, AuthModule, FilesModule, MailModule, AuditEventsModule],
  controllers: [AccessRequestAutomationController, AccessRequestsController, AccountActivationController, DocumentCorrectionController],
  providers: [
    AccessRequestsService,
    AccessRequestsRepository,
    AccountActivationService,
    AccountActivationRepository,
    ActivationOtpRepository,
    ActivationOtpService,
    RejectionNotificationService,
    RejectionMailContextService,
    RejectionMailLinkService,
    RejectionMailRepository,
    DocumentValidationRepository,
    AutomaticValidationService,
    DocumentCorrectionRepository,
    DocumentCorrectionAuthorizationService,
    DocumentCorrectionService,
    DocumentCorrectionGuard,
    { provide: MAIL_SENDER, useClass: MailServiceSender },
  ],
  exports: [AccessRequestsService, AutomaticValidationService, DocumentCorrectionAuthorizationService],
})
export class AccessRequestsModule {}
