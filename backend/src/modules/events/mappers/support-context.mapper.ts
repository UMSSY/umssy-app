import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportEventRecord } from '../types/support-event-record.types.js';

export function mapSupportContext(event: SupportEventRecord): EventSupportContext {
  return { id: event.id, statusTitle: event.status.title, originTitle: event.origin.title,
    votingDeadline: event.votingDeadline, supportThreshold: event.supportThreshold, supportCount: event._count.registrations };
}
