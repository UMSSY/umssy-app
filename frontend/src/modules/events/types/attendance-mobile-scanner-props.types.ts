import type { EventSession } from './event-session.types';

export interface AttendanceMobileScannerProps {
  workshopId: string;
  sessions?: EventSession[];
}
