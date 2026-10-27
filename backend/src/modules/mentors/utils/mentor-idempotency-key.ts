import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';

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
