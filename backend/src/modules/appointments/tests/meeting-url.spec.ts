import { describe, expect, it } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { buildMeetingUrl, canShareMeetingUrl } from '../utils/meeting-url.js';

const END_AT = new Date('2026-11-12T15:00:00.000Z');
const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

describe('buildMeetingUrl', () => {
  it('genera una sala de meet.jit.si con el prefijo umssy y un uuid', () => {
    expect(buildMeetingUrl()).toMatch(
      new RegExp(`^https://meet\\.jit\\.si/umssy-${UUID_PATTERN}$`),
    );
  });

  it('genera una sala distinta en cada llamada', () => {
    expect(buildMeetingUrl()).not.toBe(buildMeetingUrl());
  });
});

describe('canShareMeetingUrl', () => {
  it.each([
    AppointmentStatusTitle.CONFIRMED,
    AppointmentStatusTitle.LEGACY_CONFIRMED,
  ])('comparte el enlace de una cita %s que no terminó', (title) => {
    expect(
      canShareMeetingUrl(title, END_AT, new Date(END_AT.getTime() - 1)),
    ).toBe(true);
  });

  it('no comparte el enlace desde la hora exacta de fin', () => {
    expect(
      canShareMeetingUrl(AppointmentStatusTitle.CONFIRMED, END_AT, END_AT),
    ).toBe(false);
  });

  it.each([
    AppointmentStatusTitle.CANCELLED,
    AppointmentStatusTitle.COMPLETED,
    AppointmentStatusTitle.LEGACY_PENDING,
  ])('no comparte el enlace de una cita %s', (title) => {
    expect(
      canShareMeetingUrl(title, END_AT, new Date(END_AT.getTime() - 60_000)),
    ).toBe(false);
  });
});
