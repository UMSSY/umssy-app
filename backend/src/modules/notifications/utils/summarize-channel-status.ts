import type { NotificationChannelStatus } from '../types/notification-channel-status.type.js';

export function summarizeChannelStatus(
  successCount: number,
  failedCount: number,
): NotificationChannelStatus {
  if (successCount > 0 && failedCount === 0) return 'sent';
  if (successCount > 0 && failedCount > 0) return 'partial';
  if (successCount === 0 && failedCount > 0) return 'failed';
  return 'skipped';
}
