import type { AuditTimelineItem } from "./audit-timeline-item.types";

export interface AuditEventTimeline {
  requestCode: string;
  focusedEventId: string;
  items: AuditTimelineItem[];
}
