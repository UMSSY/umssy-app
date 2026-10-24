import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { EventsController } from './controllers/events.controller.js';
import { EventsService } from './services/events.service.js';
import { EventsRepository } from './repositories/events.repository.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService],
})
export class EventsModule {}