import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller.js';
import { EventsService } from './services/events.service.js';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
