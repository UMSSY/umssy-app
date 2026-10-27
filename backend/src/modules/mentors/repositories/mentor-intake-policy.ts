import { createHash, randomUUID } from 'node:crypto';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { Prisma } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';

type Preferences = { technicalAreaIds: string[]; orientationTypeIds: string[] };
type Outcome = {
  status: number;
  data: unknown;
  detail?: string;
  retryAfterSeconds?: number;
};
type CachedAttempt = { payloadHash: string; outcome: Outcome };
const SUSPENSION_MESSAGE =
  'Tu capacidad para solicitar participación como mentor ha sido suspendida temporalmente. Recibirás más información en tu correo institucional.';

function responseAt(outcome: Outcome, now: Date): Outcome {
  const endsAt = (outcome.data as { sanctionEndsAt?: string } | null)
    ?.sanctionEndsAt;
  return outcome.status === 429 && endsAt
    ? {
        ...outcome,
        retryAfterSeconds: Math.max(
          0,
          Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 1000),
        ),
      }
    : outcome;
}

export function requireMentorIdempotencyKey(value: string | undefined): string {
  if (
    !value ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new MentorParticipationException(
      'Se requiere una clave UUID Idempotency-Key válida',
      400,
      { code: 'INVALID_IDEMPOTENCY_KEY' },
    );
  }
  return value.toLowerCase();
}

/** Both public routes use the same DB lock, rolling window and replay store. */
export async function withMentorIntake<T>(
  prisma: PrismaService,
  userId: string,
  operation: 'ACTIVATE' | 'REQUEST',
  key: string,
  preferences: Preferences,
  action: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  key = requireMentorIdempotencyKey(key);
  const payloadHash = createHash('sha256')
    .update(
      JSON.stringify({
        technicalAreaIds: [...preferences.technicalAreaIds].sort(),
        orientationTypeIds: [...preferences.orientationTypeIds].sort(),
      }),
    )
    .digest('hex');
  const outcome = await withMentorCapacityLock(
    prisma,
    async (tx): Promise<Outcome> => {
      const [{ now }] = await tx.$queryRaw<
        { now: Date }[]
      >`SELECT clock_timestamp() AS now`;
      const [cached] = await tx.$queryRaw<CachedAttempt[]>`
      SELECT payload_hash AS "payloadHash", response_data AS outcome FROM mentor_intake_attempts
      WHERE user_id = ${userId}::uuid AND operation = ${operation} AND idempotency_key = ${key}::uuid`;
      if (cached) {
        if (cached.payloadHash !== payloadHash)
          return {
            status: 409,
            data: { code: 'IDEMPOTENCY_KEY_CONFLICT' },
            detail: 'La clave ya se utilizó con otras preferencias',
          };
        return responseAt(cached.outcome, now);
      }
      const [active] = await tx.$queryRaw<{ endsAt: Date }[]>`
      SELECT ends_at AS "endsAt" FROM mentor_participation_sanctions
      WHERE user_id = ${userId}::uuid AND ends_at > ${now} ORDER BY ends_at DESC LIMIT 1`;
      const [{ count }] = await tx.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM mentor_intake_attempts WHERE user_id = ${userId}::uuid
        AND counted AND occurred_at > ${now}::timestamptz - INTERVAL '24 hours' AND occurred_at <= ${now}`;
      const id = randomUUID();
      const counted = !active;
      let result: Outcome;
      let sanctionEndsAt: Date | undefined = active?.endsAt;
      if (!active && count >= 4)
        sanctionEndsAt = new Date(now.getTime() + 72 * 3600000);
      if (sanctionEndsAt) {
        result = {
          status: 429,
          detail: SUSPENSION_MESSAGE,
          data: {
            code: 'MENTOR_REQUEST_SUSPENDED',
            sanctionEndsAt: sanctionEndsAt.toISOString(),
          },
        };
      } else {
        try {
          result = { status: 201, data: await action(tx) };
        } catch (error) {
          // Expected rejections count; internal failures roll back every write.
          if (!(error instanceof DomainException) || error.statusCode >= 500)
            throw error;
          result = {
            status: error.statusCode,
            data: error.data,
            detail: error.message,
          };
        }
      }
      await tx.$executeRaw`
      INSERT INTO mentor_intake_attempts(id, user_id, operation, idempotency_key, payload_hash, occurred_at, counted, response_status, response_data)
      VALUES (${id}::uuid, ${userId}::uuid, ${operation}, ${key}::uuid, ${payloadHash}, ${now}, ${counted}, ${result.status}, ${JSON.stringify(result)}::jsonb)`;
      if (sanctionEndsAt && !active) {
        const [sanction] = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO mentor_participation_sanctions(user_id, trigger_attempt_id, started_at, ends_at)
        VALUES (${userId}::uuid, ${id}::uuid, ${now}, ${sanctionEndsAt}) RETURNING id`;
        await tx.$executeRaw`
        INSERT INTO mentor_mail_outbox(event_key, kind, user_id, recipient, payload)
        SELECT ${'sanction:' + sanction.id}, 'SANCTION', u.id, u.email,
          jsonb_build_object('sanctionEndsAt', ${sanctionEndsAt.toISOString()}::text)
        FROM users u WHERE u.id = ${userId}::uuid ON CONFLICT(event_key) DO NOTHING`;
      }
      return responseAt(result, now);
    },
  );
  if (outcome.status >= 400) {
    const error = new MentorParticipationException(
      outcome.detail ?? 'No se pudo completar la operación',
      outcome.status,
      outcome.data,
    );
    error.retryAfterSeconds = outcome.retryAfterSeconds;
    throw error;
  }
  return outcome.data as T;
}
