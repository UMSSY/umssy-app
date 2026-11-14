'use client';

import { useEffect, useState } from 'react';
import { formatRegistrationTime } from '../utils/registration-format';

type EventSchedule = {
  eventDate: string;
  startTime?: string | null;
  endTime: string | null;
};

type EventScheduleStatus = {
  isFinished: boolean;
  isInProgress: boolean;
};

const getEventInstant = (date: string, time: string | null | undefined) => {
  if (!time) return Number.NaN;
  return Date.parse(
    `${date.split('T')[0]}T${formatRegistrationTime(time)}:00-04:00`,
  );
};

export function useEventScheduleStatus(
  event: EventSchedule,
): EventScheduleStatus;
export function useEventScheduleStatus(
  events: EventSchedule[],
): EventScheduleStatus[];
export function useEventScheduleStatus(
  eventOrEvents: EventSchedule | EventSchedule[],
): EventScheduleStatus | EventScheduleStatus[];
export function useEventScheduleStatus(
  eventOrEvents: EventSchedule | EventSchedule[],
): EventScheduleStatus | EventScheduleStatus[] {
  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
  const [now, setNow] = useState(Date.now);
  const schedules = events.map((event) => ({
    startsAt: getEventInstant(event.eventDate, event.startTime),
    endsAt: getEventInstant(event.eventDate, event.endTime),
  }));
  const schedulesKey = schedules
    .map(({ startsAt, endsAt }) => `${startsAt},${endsAt}`)
    .join(';');
  const statuses = schedules.map(({ startsAt, endsAt }) => ({
    isFinished: Number.isFinite(endsAt) && now >= endsAt,
    isInProgress:
      Number.isFinite(startsAt) &&
      Number.isFinite(endsAt) &&
      now >= startsAt &&
      now < endsAt,
  }));
  const nextBoundary = schedules
    .flatMap(({ startsAt, endsAt }) => [startsAt, endsAt])
    .filter((boundary) => Number.isFinite(boundary) && now < boundary)
    .reduce<number | null>(
      (earliest, boundary) =>
        earliest === null ? boundary : Math.min(earliest, boundary),
      null,
    );

  useEffect(() => {
    if (nextBoundary === null) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(nextBoundary - Date.now(), 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [nextBoundary, schedulesKey]);

  return Array.isArray(eventOrEvents) ? statuses : (statuses[0] ?? {
    isFinished: false,
    isInProgress: false,
  });
}

export function useEventFinished(event: EventSchedule): boolean;
export function useEventFinished(events: EventSchedule[]): boolean[];
export function useEventFinished(
  eventOrEvents: EventSchedule | EventSchedule[],
): boolean | boolean[] {
  const statuses = useEventScheduleStatus(eventOrEvents);
  return Array.isArray(statuses)
    ? statuses.map(({ isFinished }) => isFinished)
    : statuses.isFinished;
}
