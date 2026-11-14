import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobOffersService } from '../services/job-offers.service.js';

@Injectable()
export class JobOfferExpirationScheduler {
  private readonly logger = new Logger(JobOfferExpirationScheduler.name);
  private running = false;

  constructor(private readonly jobOffersService: JobOffersService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'close-expired-job-offers' })
  async closeExpiredOffers(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const closed = await this.jobOffersService.closeExpiredOffers();
      if (closed > 0) {
        this.logger.log(`Vacantes cerradas por vencimiento: ${closed}`);
      }
    } catch (error) {
      this.logger.error(
        'No se pudieron cerrar las vacantes vencidas',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}