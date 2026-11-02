import { calculateProgressPercent, calculateSupportsRemaining } from '../../../common/utils/support-progress.js';
import { PUBLISHED_STATUS_TITLE } from '../../events/constants/events.constants.js';
import { VOTING_STATUS_RESPONSE } from '../constants/event-registrations.constants.js';
import type { SupportTransactionResult } from '../types/support-transaction-result.types.js';
import type { SupportResponse } from '../types/support-response.types.js';

export function mapSupportResponse(eventId: string, result: SupportTransactionResult): SupportResponse {
  return { eventId, status: result.published ? PUBLISHED_STATUS_TITLE : VOTING_STATUS_RESPONSE,
    supportCount: result.supportCount, supportThreshold: result.supportThreshold,
    supportsRemaining: calculateSupportsRemaining(result.supportCount, result.supportThreshold),
    progressPercent: calculateProgressPercent(result.supportCount, result.supportThreshold), hasSupported: true };
}
