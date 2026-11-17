import { Module } from '@nestjs/common';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';
import { MentorsModule } from '../mentors/mentors.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { AppointmentDocumentsController } from './controllers/appointment-documents.controller.js';
import { AppointmentsController } from './controllers/appointments.controller.js';
import { AppointmentDocumentMapper } from './mappers/appointment-document.mapper.js';
import { AppointmentMapper } from './mappers/appointment.mapper.js';
import { AppointmentNotificationsService } from './notification/appointment-notifications.service.js';
import { AppointmentDocumentsRepository } from './repositories/appointment-documents.repository.js';
import { AppointmentNotificationsRepository } from './repositories/appointment-notifications.repository.js';
import { AppointmentsRepository } from './repositories/appointments.repository.js';
import { AppointmentDocumentsService } from './services/appointment-documents.service.js';
import { AppointmentsService } from './services/appointments.service.js';

@Module({
  imports: [
    AuthModule,
    AvailabilityModule,
    MentorsModule,
    NotificationsModule,
    ProfileModule,
  ],
  controllers: [AppointmentsController, AppointmentDocumentsController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    AppointmentMapper,
    AppointmentNotificationsService,
    AppointmentNotificationsRepository,
    AppointmentDocumentsService,
    AppointmentDocumentsRepository,
    AppointmentDocumentMapper,
    FileValidationService,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
