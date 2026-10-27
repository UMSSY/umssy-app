import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MentorOffersService } from './mentor-offers.service.js';

@Injectable()
export class MentorOffersWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MentorOffersWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(private readonly offers: MentorOffersService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => { void this.tick(); }, 15_000);
    this.timer.unref();
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.offers.reconcile();
    } catch (error) {
      this.logger.error('No se pudieron vencer y reasignar las ofertas de mentoría',
        error instanceof Error ? error.stack : String(error));
    } finally {
      this.running = false;
    }
  }
}
