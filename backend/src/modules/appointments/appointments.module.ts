import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';
import { MentorsModule } from '../mentors/mentors.module.js';
import { AppointmentsController } from './controllers/appointments.controller.js';
import { AppointmentMapper } from './mappers/appointment.mapper.js';
import { AppointmentsRepository } from './repositories/appointments.repository.js';
import { AppointmentsService } from './services/appointments.service.js';

@Module({
  imports: [AuthModule, AvailabilityModule, MentorsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, AppointmentMapper],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
