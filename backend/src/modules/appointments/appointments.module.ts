import { Module } from '@nestjs/common';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';
import { MentorsModule } from '../mentors/mentors.module.js';
import { AppointmentDocumentsController } from './controllers/appointment-documents.controller.js';
import { AppointmentsController } from './controllers/appointments.controller.js';
import { AppointmentDocumentMapper } from './mappers/appointment-document.mapper.js';
import { AppointmentMapper } from './mappers/appointment.mapper.js';
import { AppointmentDocumentsRepository } from './repositories/appointment-documents.repository.js';
import { AppointmentsRepository } from './repositories/appointments.repository.js';
import { AppointmentDocumentsService } from './services/appointment-documents.service.js';
import { AppointmentsService } from './services/appointments.service.js';

@Module({
  imports: [AuthModule, AvailabilityModule, MentorsModule],
  controllers: [AppointmentsController, AppointmentDocumentsController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    AppointmentMapper,
    AppointmentDocumentsService,
    AppointmentDocumentsRepository,
    AppointmentDocumentMapper,
    FileValidationService,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
