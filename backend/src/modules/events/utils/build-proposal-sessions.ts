import type { ProposalSessionRecord } from '../types/proposal-session-record.types.js';
import { toBoliviaInstant } from './event-session-schedule.js';

interface ProposalScheduleInput {
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  additionalSessions?: {
    eventDate: string;
    startTime: string;
    endTime: string;
    location?: string;
  }[];
}

export function buildProposalSessions(
  values: ProposalScheduleInput,
): ProposalSessionRecord[] {
  const drafts = [
    values,
    ...(values.additionalSessions ?? []).map((session) => ({
      ...session,
      location: session.location ?? values.location,
    })),
  ];
  return drafts
    .map((draft) => ({
      eventDate: draft.eventDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      location: draft.location,
      startsAt: toBoliviaInstant(draft.eventDate, draft.startTime),
      endsAt: toBoliviaInstant(draft.eventDate, draft.endTime),
    }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
