import type { TransactionClient } from '../types/transaction-client.types.js';
import { buildMentorDayLockKey } from '../utils/mentor-day-lock-key.js';

// Bloquear una fecha y reservar una cita del mismo día toman este lock dentro de su
// transacción, así nunca queda una cita confirmada en una fecha bloqueada (HU-08 CA15).
export async function lockMentorDay(
  tx: TransactionClient,
  mentorId: string,
  day: string,
): Promise<void> {
  const key = buildMentorDayLockKey(mentorId, day);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
