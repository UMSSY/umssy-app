import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EventRegistrationsController } from './controllers/event-registrations.controller.js';
import { EventRegistrationsRepository } from './repositories/event-registrations.repository.js';
import { EventRegistrationsService } from './services/event-registrations.service.js';
import { EventsModule } from '../events/index.js';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [EventRegistrationsController],
  providers: [EventRegistrationsRepository, EventRegistrationsService, RolesGuard],
  exports: [EventRegistrationsService],
})
export class EventRegistrationsModule {}
