import { MentorMailStatusCode } from '../types/mentor-mail-status.enum.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { MentorOutboxMessage } from '../types/mentor-outbox-message.types.js';

@Injectable()
export class MentorMailOutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  quarantineInterrupted() {
    return this.prisma.$executeRaw`
      UPDATE mentor_mail_outbox SET status_id = mentor_mail_status(${MentorMailStatusCode.UNCERTAIN}), last_error = 'DISPATCH_INTERRUPTED'
      WHERE status_id = mentor_mail_status(${MentorMailStatusCode.SENDING}) AND claimed_at < clock_timestamp() - INTERVAL '5 minutes'`;
  }

  async claim() {
    const [message] = await this.prisma.$queryRaw<MentorOutboxMessage[]>`
      WITH next AS (SELECT id FROM mentor_mail_outbox WHERE status_id = mentor_mail_status(${MentorMailStatusCode.PENDING}) AND available_at <= clock_timestamp()
        ORDER BY available_at, id FOR UPDATE SKIP LOCKED LIMIT 1)
      UPDATE mentor_mail_outbox m SET status_id = mentor_mail_status(${MentorMailStatusCode.SENDING}), claimed_at = clock_timestamp(), attempts = attempts + 1
      FROM next WHERE m.id = next.id RETURNING m.id, mentor_mail_kind_title(m.kind_id) AS kind, m.recipient, m.payload, m.attempts`;
    return message;
  }

  async offerIsCurrent(id: string) {
    const [offer] = await this.prisma.$queryRaw<{ valid: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM mentor_slot_offers WHERE id::text = ${id} AND status_id = mentor_offer_status('OFFERED')
        AND expires_at > clock_timestamp()) AS valid`;
    return offer.valid;
  }

  supersede(id: string) {
    return this.prisma
      .$executeRaw`UPDATE mentor_mail_outbox SET status_id = mentor_mail_status(${MentorMailStatusCode.SUPERSEDED}), last_error = NULL
      WHERE id = ${id}::uuid AND status_id = mentor_mail_status(${MentorMailStatusCode.SENDING})`;
  }

  retry(id: string, seconds: number) {
    return this.prisma.$executeRaw`UPDATE mentor_mail_outbox
      SET status_id = mentor_mail_status(${MentorMailStatusCode.PENDING}), claimed_at = NULL, last_error = 'SMTP_RETRYABLE',
        available_at = clock_timestamp() + ${seconds} * INTERVAL '1 second'
      WHERE id = ${id}::uuid AND status_id = mentor_mail_status(${MentorMailStatusCode.SENDING})`;
  }

  sent(id: string) {
    return this.prisma
      .$executeRaw`UPDATE mentor_mail_outbox SET status_id = mentor_mail_status(${MentorMailStatusCode.SENT}), sent_at = clock_timestamp(), last_error = NULL
      WHERE id = ${id}::uuid AND status_id = mentor_mail_status(${MentorMailStatusCode.SENDING})`;
  }

  uncertain(id: string, reason: string) {
    return this.prisma
      .$executeRaw`UPDATE mentor_mail_outbox SET status_id = mentor_mail_status(${MentorMailStatusCode.UNCERTAIN}), last_error = ${reason}
      WHERE id = ${id}::uuid AND status_id = mentor_mail_status(${MentorMailStatusCode.SENDING})`;
  }
}
