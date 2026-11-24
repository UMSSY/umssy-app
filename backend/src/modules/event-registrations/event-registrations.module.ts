import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EventRegistrationsController } from './controllers/event-registrations.controller.js';
import { AttendanceCheckInController } from './controllers/attendance-check-in.controller.js';
import { EventRegistrationsRepository } from './repositories/event-registrations.repository.js';
import { AttendanceValidationRepository } from './repositories/attendance-validation.repository.js';
import { AttendanceCheckInRepository } from './repositories/attendance-check-in.repository.js';
import { AttendanceValidationService } from './services/attendance-validation.service.js';
import { AttendanceCheckInService } from './services/attendance-check-in.service.js';
import { EventRegistrationsService } from './services/event-registrations.service.js';
import { EventsModule } from '../events/index.js';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [EventRegistrationsController, AttendanceCheckInController],
  providers: [
    EventRegistrationsRepository,
    AttendanceValidationRepository,
    AttendanceValidationService,
    AttendanceCheckInRepository,
    AttendanceCheckInService,
    EventRegistrationsService,
    RolesGuard,
  ],
  exports: [EventRegistrationsService, AttendanceValidationService],
})
export class EventRegistrationsModule {}
