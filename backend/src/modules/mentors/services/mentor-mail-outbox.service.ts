import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MailService } from '../../mail/services/mail.service.js';

type OutboxMessage = {
  id: string;
  kind: string;
  recipient: string;
  attempts: number;
  payload: { offerId?: string; expiresAt?: string; sanctionEndsAt?: string };
};

function safeToRetry(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as {
    code?: string;
    command?: string;
    responseCode?: number;
    message?: string;
  };
  return (
    ['EAUTH', 'EDNS', 'ECONNECTION', 'EENVELOPE'].includes(
      failure.code ?? '',
    ) ||
    (failure.code === 'ETIMEDOUT' && failure.command === 'CONN') ||
    (typeof failure.responseCode === 'number' && failure.responseCode >= 400) ||
    failure.message === 'SMTP did not accept the email recipient.'
  );
}

@Injectable()
export class MentorMailOutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async dispatch() {
    // Console transport is not evidence of delivery. Leave events pending.
    if (!this.mail.isSmtpConfigured()) return;
    // SMTP cannot prove whether an interrupted DATA was accepted. Never resend
    // an abandoned in-flight event automatically: require delivery reconciliation.
    await this.prisma.$executeRaw`
      UPDATE mentor_mail_outbox SET status = 'UNCERTAIN', last_error = 'DISPATCH_INTERRUPTED'
      WHERE status = 'SENDING' AND claimed_at < clock_timestamp() - INTERVAL '5 minutes'`;
    for (let index = 0; index < 10; index++) {
      const [message] = await this.prisma.$queryRaw<OutboxMessage[]>`
        WITH next AS (
          SELECT id FROM mentor_mail_outbox WHERE status = 'PENDING' AND available_at <= clock_timestamp()
          ORDER BY available_at, id FOR UPDATE SKIP LOCKED LIMIT 1
        )
        UPDATE mentor_mail_outbox m SET status = 'SENDING', claimed_at = clock_timestamp(), attempts = attempts + 1
        FROM next WHERE m.id = next.id RETURNING m.id, m.kind, m.recipient, m.payload, m.attempts`;
      if (!message) break;
      if (message.kind === 'OFFER') {
        const [offer] = await this.prisma.$queryRaw<{ valid: boolean }[]>`
          SELECT EXISTS (SELECT 1 FROM mentor_slot_offers
            WHERE id::text = ${message.payload.offerId ?? ''} AND status = 'OFFERED'
              AND expires_at > clock_timestamp()) AS valid`;
        if (!offer.valid) {
          await this.prisma.$executeRaw`
            UPDATE mentor_mail_outbox SET status = 'SUPERSEDED', last_error = NULL
            WHERE id = ${message.id}::uuid AND status = 'SENDING'`;
          continue;
        }
      }
      const deadline =
        message.kind === 'OFFER'
          ? message.payload.expiresAt
          : message.payload.sanctionEndsAt;
      if (!deadline || Number.isNaN(new Date(deadline).getTime())) {
        await this.uncertain(message.id, 'INVALID_EVENT');
        continue;
      }
      const date = new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'America/La_Paz',
      }).format(new Date(deadline));
      const subject =
        message.kind === 'OFFER'
          ? 'Tienes un cupo disponible para mentoría'
          : 'Suspensión temporal de solicitudes de mentoría';
      const text =
        message.kind === 'OFFER'
          ? `Tienes una oferta de cupo. El plazo es de 24 horas desde la asignación y vence el ${date} BOT. Ingresa a Mi participación en UMSSY para confirmar.`
          : `Tus solicitudes de participación como mentor se han suspendido durante 72 horas. Podrás volver a solicitar después del ${date} BOT. Las solicitudes y ofertas anteriores se conservan.`;
      try {
        await this.mail.send({
          to: message.recipient,
          subject,
          text,
          messageId: `<${message.id}@mentor-notifications.umssy>`,
          mjml: '<mj-section><mj-column><mj-text>{{message}}</mj-text></mj-column></mj-section>',
          values: { message: text },
        });
      } catch (error) {
        if (safeToRetry(error) && message.attempts < 10) {
          const seconds = Math.min(
            3600,
            30 * 2 ** Math.min(message.attempts, 7),
          );
          await this.prisma.$executeRaw`
            UPDATE mentor_mail_outbox SET status = 'PENDING', claimed_at = NULL, last_error = 'SMTP_RETRYABLE',
              available_at = clock_timestamp() + ${seconds} * INTERVAL '1 second'
            WHERE id = ${message.id}::uuid AND status = 'SENDING'`;
        } else await this.uncertain(message.id, 'SMTP_DELIVERY_UNCERTAIN');
        continue;
      }
      // A DB failure after SMTP acceptance intentionally leaves SENDING. The
      // next worker quarantines it rather than risking duplicate delivery.
      await this.prisma.$executeRaw`
        UPDATE mentor_mail_outbox SET status = 'SENT', sent_at = clock_timestamp(), last_error = NULL
        WHERE id = ${message.id}::uuid AND status = 'SENDING'`;
    }
  }

  private uncertain(id: string, reason: string) {
    return this.prisma.$executeRaw`
      UPDATE mentor_mail_outbox SET status = 'UNCERTAIN', last_error = ${reason}
      WHERE id = ${id}::uuid AND status = 'SENDING'`;
  }
}
