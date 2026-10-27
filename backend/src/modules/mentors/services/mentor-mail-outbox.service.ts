import { MentorMailKindCode } from '../types/mentor-mail-kind.enum.js';
import { Injectable } from '@nestjs/common';
import { MentorMailOutboxRepository } from '../repositories/mentor-mail-outbox.repository.js';
import { MailService } from '../../mail/services/mail.service.js';
import type { MentorMailDeliveryFailure } from '../types/mentor-mail-delivery-failure.types.js';

function safeToRetry(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as MentorMailDeliveryFailure;
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
    private readonly repository: MentorMailOutboxRepository,
    private readonly mail: MailService,
  ) {}

  async dispatch() {
    if (!this.mail.isSmtpConfigured()) return;
    await this.repository.quarantineInterrupted();
    for (let index = 0; index < 10; index++) {
      const message = await this.repository.claim();
      if (!message) break;
      if (message.kind === MentorMailKindCode.OFFER) {
        if (
          !(await this.repository.offerIsCurrent(message.payload.offerId ?? ''))
        ) {
          await this.repository.supersede(message.id);
          continue;
        }
      }
      const deadline =
        message.kind === MentorMailKindCode.OFFER
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
        message.kind === MentorMailKindCode.OFFER
          ? 'Tienes un cupo disponible para mentoría'
          : 'Suspensión temporal de solicitudes de mentoría';
      const text =
        message.kind === MentorMailKindCode.OFFER
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
          await this.repository.retry(message.id, seconds);
        } else await this.uncertain(message.id, 'SMTP_DELIVERY_UNCERTAIN');
        continue;
      }
      await this.repository.sent(message.id);
    }
  }

  private uncertain(id: string, reason: string) {
    return this.repository.uncertain(id, reason);
  }
}
