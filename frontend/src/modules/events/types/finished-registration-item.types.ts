import type { EventSession } from './event-session.types';

export interface FinishedRegistrationItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  sessions?: EventSession[];
}
