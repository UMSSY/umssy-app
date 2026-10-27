import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { MentorOffersService } from './mentor-offers.service.js';
import { MentorMailOutboxService } from './mentor-mail-outbox.service.js';

@Injectable()
export class MentorOffersWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MentorOffersWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly offers: MentorOffersService,
    @Optional() private readonly outbox?: MentorMailOutboxService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 15_000);
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
      await this.outbox?.dispatch();
    } catch {
      this.logger.error(
        'No se pudo completar la reconciliación o el despacho de correo de mentoría',
      );
    } finally {
      this.running = false;
    }
  }
}
