import type { EventDetail } from './event-detail.types';

export interface EventRegistrationActionProps {
  event: EventDetail;
  onEventNotFound?: () => void;
}
