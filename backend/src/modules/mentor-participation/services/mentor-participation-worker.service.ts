import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { MentorMailService } from './mentor-mail.service.js';
import { MentorParticipationService } from './mentor-participation.service.js';

@Injectable()
export class MentorParticipationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MentorParticipationWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;

  constructor(private readonly participation: MentorParticipationService,
    private readonly prisma: PrismaService, private readonly mail: MentorMailService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => { void this.tick(); }, 15_000);
    void this.tick();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private withUtc<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      return operation(tx);
    });
  }

  async tick(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.participation.reconcile();
      const now = new Date();
      const events = await this.withUtc((tx) => tx.mentorEmailOutbox.findMany({
        where: { status: { in: ['PENDING', 'SENDING'] }, nextAttemptAt: { lte: now } },
        orderBy: { createdAt: 'asc' }, take: 20,
      }));
      for (const event of events) {
        const claimed = await this.withUtc((tx) => tx.mentorEmailOutbox.updateMany({
          where: { id: event.id, status: event.status, nextAttemptAt: { lte: now } },
          data: { status: 'SENDING', attempts: { increment: 1 }, nextAttemptAt: new Date(now.getTime() + 5 * 60_000) },
        }));
        if (!claimed.count) continue;
        try {
          await this.mail.send(event);
          await this.withUtc((tx) => tx.mentorEmailOutbox.update({ where: { id: event.id },
            data: { status: 'SENT', sentAt: new Date(), lastError: null } }));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          await this.withUtc((tx) => tx.mentorEmailOutbox.update({ where: { id: event.id }, data: {
            status: 'PENDING', lastError: detail.slice(0, 500),
            nextAttemptAt: new Date(Date.now() + Math.min(30 * 60_000, 2 ** Math.min(event.attempts, 10) * 15_000)),
          } }));
          this.logger.warn(`Correo HU7 pendiente de reintento: ${event.id}`);
        }
      }
    } catch (error) {
      this.logger.error('No se pudo reconciliar la cola HU7', error instanceof Error ? error.stack : String(error));
    } finally { this.busy = false; }
  }
}
