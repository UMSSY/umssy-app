import type { EventSessionSchedule } from './event-session-schedule.types.js';

export interface RegistrationScheduleEvent {
  id: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  sessions?: EventSessionSchedule[];
}
