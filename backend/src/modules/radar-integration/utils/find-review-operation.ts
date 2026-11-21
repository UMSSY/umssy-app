import type { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { ReviewOperationIdentity } from '../types/review-operation-identity.types.js';
import { RadarReviewNotFoundException } from '../exceptions/radar-review-not-found.exception.js';
import { RadarReviewOperationConflictException } from '../exceptions/radar-review-operation-conflict.exception.js';
export async function findReviewOperation(
  repository: RadarReviewRepository,
  context: TransactionContext,
  identity: ReviewOperationIdentity,
) {
  await repository.lockReviewOperation(identity.operationId, context);
  const [saved] = await repository.findReviewOperation(
    identity.operationId,
    context,
  );
  if (!saved) return null;
  if (saved.admin_id !== identity.adminId)
    throw new RadarReviewNotFoundException('Operacion no encontrada');
  const matches =
    saved.flow === identity.flow &&
    (!identity.kind || saved.kind === identity.kind);
  if (identity.payloadHash === undefined) {
    if (!matches)
      throw new RadarReviewNotFoundException('Operacion no encontrada');
  } else if (
    !matches ||
    saved.target_id !== identity.targetId ||
    saved.payload_hash !== identity.payloadHash
  ) {
    throw new RadarReviewOperationConflictException();
  }
  return saved;
}
