import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from './events.service.js';

@Injectable()
export class EventsCronService {
  private readonly logger = new Logger(EventsCronService.name);

  constructor(private readonly eventsService: EventsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpireOverdueProposals() {
    try {
      const expiredCount = await this.eventsService.expireOverdueProposals(new Date());
      if (expiredCount > 0) {
        this.logger.log(`Se vencieron ${expiredCount} propuestas automáticamente.`);
      }
    } catch (error) {
      this.logger.error('Error al vencer propuestas automáticamente', error);
    }
  }
}