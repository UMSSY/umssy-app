import { z } from 'zod';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';

const mentorIdempotencyKeySchema = z
  .string()
  .uuid()
  .refine(
    (value) =>
      value !== '00000000-0000-0000-0000-000000000000' &&
      value.toLowerCase() !== 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  )
  .transform((value) => value.toLowerCase());

export function requireMentorIdempotencyKey(value: string | undefined): string {
  const result = mentorIdempotencyKeySchema.safeParse(value);
  if (!result.success) {
    throw new MentorParticipationException(
      'Se requiere una clave UUID Idempotency-Key válida',
      400,
      { code: 'INVALID_IDEMPOTENCY_KEY' },
    );
  }
  return result.data;
}
