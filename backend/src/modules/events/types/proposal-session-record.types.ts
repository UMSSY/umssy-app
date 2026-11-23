import type { EventSessionSchedule } from './event-session-schedule.types.js';

export interface ProposalSessionRecord extends EventSessionSchedule {
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
}
