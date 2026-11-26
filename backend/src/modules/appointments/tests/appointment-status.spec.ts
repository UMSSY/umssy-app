import { describe, expect, it } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { resolveAppointmentStatus } from '../utils/appointment-status.js';

const END_AT = new Date('2026-11-12T15:00:00.000Z');
const millisecondsFromEnd = (offset: number) =>
  new Date(END_AT.getTime() + offset);

describe('resolveAppointmentStatus', () => {
  it('devuelve COMPLETED desde la hora exacta de fin de una cita confirmada', () => {
    expect(
      resolveAppointmentStatus(AppointmentStatusTitle.CONFIRMED, END_AT, END_AT),
    ).toBe(AppointmentStatusTitle.COMPLETED);
  });

  it('devuelve COMPLETED después de la hora de fin', () => {
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.CONFIRMED,
        END_AT,
        millisecondsFromEnd(60_000),
      ),
    ).toBe(AppointmentStatusTitle.COMPLETED);
  });

  it('mantiene CONFIRMED mientras la cita está en curso', () => {
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.CONFIRMED,
        END_AT,
        millisecondsFromEnd(-1),
      ),
    ).toBe(AppointmentStatusTitle.CONFIRMED);
  });

  it('trata la confirmación heredada igual que CONFIRMED', () => {
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.LEGACY_CONFIRMED,
        END_AT,
        millisecondsFromEnd(-1),
      ),
    ).toBe(AppointmentStatusTitle.CONFIRMED);
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.LEGACY_CONFIRMED,
        END_AT,
        END_AT,
      ),
    ).toBe(AppointmentStatusTitle.COMPLETED);
  });

  it('normaliza la completada heredada a COMPLETED', () => {
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.LEGACY_COMPLETED,
        END_AT,
        millisecondsFromEnd(60_000),
      ),
    ).toBe(AppointmentStatusTitle.COMPLETED);
  });

  it('normaliza la cancelada heredada a CANCELLED aunque ya haya pasado', () => {
    expect(
      resolveAppointmentStatus(
        AppointmentStatusTitle.LEGACY_CANCELLED,
        END_AT,
        millisecondsFromEnd(60_000),
      ),
    ).toBe(AppointmentStatusTitle.CANCELLED);
  });

  it.each([
    AppointmentStatusTitle.CANCELLED,
    AppointmentStatusTitle.COMPLETED,
    AppointmentStatusTitle.LEGACY_PENDING,
  ])('conserva %s antes y después de la hora de fin', (title) => {
    expect(
      resolveAppointmentStatus(title, END_AT, millisecondsFromEnd(-1)),
    ).toBe(title);
    expect(
      resolveAppointmentStatus(title, END_AT, millisecondsFromEnd(60_000)),
    ).toBe(title);
  });
});
