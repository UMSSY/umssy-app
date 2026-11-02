import type { TransactionClient } from '../types/transaction-client.types.js';
import { buildMentorDayLockKey } from '../utils/mentor-day-lock-key.js';

// Toda escritura en un día de un mentor (bloquear la fecha, crear o mover un bloque y, desde #1164,
// reservar una cita) debe tomar este lock en su transacción: así nunca queda una cita o un bloque
// nuevo en una fecha bloqueada (HU-08 CA15).
export async function lockMentorDay(
  tx: TransactionClient,
  mentorId: string,
  day: string,
): Promise<void> {
  const key = buildMentorDayLockKey(mentorId, day);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
