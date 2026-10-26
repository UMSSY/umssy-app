import type { EventDetail } from './event-detail.types';
export type EventDetailPanelProps = {
  event: EventDetail;
  onClose?: () => void;
  onSupport?: (event: EventDetail) => void;
  isSupportPending?: boolean;
};
