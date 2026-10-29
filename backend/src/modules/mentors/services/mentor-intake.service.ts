import { createHash, randomUUID } from 'node:crypto';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { Prisma } from '../../../prisma/client.js';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import { requireMentorIdempotencyKey } from '../requests/mentor-idempotency-key.schema.js';
import type { MentorIntakeRepository } from '../repositories/mentor-intake.repository.js';
import type { MentorIntakePreferences as Preferences } from '../types/mentor-intake-preferences.types.js';
import type { MentorIntakeOutcome as Outcome } from '../types/mentor-intake-outcome.types.js';

const SUSPENSION_MESSAGE =
  'Tu capacidad para solicitar participación como mentor ha sido suspendida temporalmente. Podrás volver a intentarlo al finalizar la sanción.';

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

export async function withMentorIntake<T>(
  repository: MentorIntakeRepository,
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
  const outcome = await repository.withLock(async (tx): Promise<Outcome> => {
    const now = await repository.now(tx);
    const cached = await repository.cachedAttempt(tx, userId, operation, key);
    if (cached) {
      if (cached.payloadHash !== payloadHash)
        return {
          status: 409,
          data: { code: 'IDEMPOTENCY_KEY_CONFLICT' },
          detail: 'La clave ya se utilizó con otras preferencias',
        };
      return responseAt(cached.outcome, now);
    }
    const active = await repository.activeSanction(tx, userId, now);
    const count = await repository.attemptCount(tx, userId, now);
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
        if (!(error instanceof DomainException) || error.statusCode >= 500)
          throw error;
        result = {
          status: error.statusCode,
          code: error.code,
          data: error.data,
          detail: error.message,
        };
      }
    }
    await repository.saveAttempt(
      tx,
      id,
      userId,
      operation,
      key,
      payloadHash,
      now,
      counted,
      result,
    );
    if (sanctionEndsAt && !active)
      await repository.saveSanction(tx, userId, id, now, sanctionEndsAt);
    return responseAt(result, now);
  });
  if (outcome.status >= 400) {
    const error = new MentorParticipationException(
      outcome.detail ?? 'No se pudo completar la operación',
      outcome.status,
      outcome.data,
      outcome.code,
    );
    error.retryAfterSeconds = outcome.retryAfterSeconds;
    throw error;
  }
  return outcome.data as T;
}
