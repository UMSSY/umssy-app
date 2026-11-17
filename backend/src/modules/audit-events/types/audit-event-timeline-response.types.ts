import type { AuditTimelineItemResponse } from './audit-timeline-item.types.js';

export interface AuditEventTimelineResponse {
  requestCode: string;
  focusedEventId: string;
  items: AuditTimelineItemResponse[];
}
