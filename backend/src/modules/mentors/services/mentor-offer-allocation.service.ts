import type { MentorTransactionRepository } from '../repositories/mentor-transaction.repository.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';
import { mentorCapacity } from '../utils/mentor-capacity.js';

export async function reconcileMentorOffers(
  repository: MentorTransactionRepository,
  tx: MentorTransaction,
) {
  await repository.expireOffers(tx);
  const { available } = mentorCapacity(await repository.capacityCounts(tx));
  if (available > 0) await repository.allocateOffers(tx, available);
}
