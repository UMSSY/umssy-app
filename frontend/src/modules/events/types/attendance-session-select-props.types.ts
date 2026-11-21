import type { EventSession } from './event-session.types';

export interface AttendanceSessionSelectProps {
  sessions: EventSession[];
  value: string;
  onChange: (sessionId: string) => void;
  disabled?: boolean;
}
