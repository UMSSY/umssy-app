import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { EventProposalsController } from './controllers/event-proposals.controller.js';
import { EventProposalsService } from './services/event-proposals.service.js';
import { EventsController } from './controllers/events.controller.js';
import { EventsService } from './services/events.service.js';
import { EventsRepository } from './repositories/events.repository.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [EventsController, EventProposalsController],
  providers: [EventsService, EventsRepository, EventProposalsService, RolesGuard, FileValidationService],
  exports: [EventsService],
})
export class EventsModule {}
