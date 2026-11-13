import { describe, expect, it } from 'vitest';
import { buildAppointmentCancellation } from '../utils/appointment-cancellation.js';
import {
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

const cancelledBy = (
  cancelledById: string | null,
  cancellationReason: string | null = null,
) =>
  createAppointmentRecord({
    status: { title: 'CANCELLED' },
    cancelledById,
    cancellationReason,
    cancelledAt: NOW,
  });

describe('buildAppointmentCancellation', () => {
  it.each([
    [MENTOR_ID, 'MENTOR'],
    [STUDENT_ID, 'STUDENT'],
  ])('identifica a %s como %s', (cancellerId, role) => {
    expect(
      buildAppointmentCancellation(cancelledBy(cancellerId), MENTOR_ID)
        .cancelledBy,
    ).toBe(role);
  });

  it('indica si quien consulta es quien canceló', () => {
    const record = cancelledBy(STUDENT_ID);

    expect(buildAppointmentCancellation(record, STUDENT_ID).cancelledByMe).toBe(
      true,
    );
    expect(buildAppointmentCancellation(record, MENTOR_ID).cancelledByMe).toBe(
      false,
    );
  });

  it.each([null, '', '   '])(
    'devuelve el motivo %j como null',
    (cancellationReason) => {
      expect(
        buildAppointmentCancellation(
          cancelledBy(MENTOR_ID, cancellationReason),
          MENTOR_ID,
        ).reason,
      ).toBeNull();
    },
  );

  it('devuelve el motivo sin espacios al inicio ni al final', () => {
    expect(
      buildAppointmentCancellation(
        cancelledBy(MENTOR_ID, '  Viaje de trabajo  '),
        STUDENT_ID,
      ).reason,
    ).toBe('Viaje de trabajo');
  });

  it.each([
    ['no se registró', null],
    ['ya no participa en la cita', OTHER_USER_ID],
  ])(
    'no atribuye la cancelación cuando quien canceló %s',
    (_case, cancellerId) => {
      expect(
        buildAppointmentCancellation(cancelledBy(cancellerId), MENTOR_ID),
      ).toMatchObject({ cancelledBy: null, cancelledByMe: false });
    },
  );

  it('devuelve la fecha de cancelación en UTC o null si no se guardó', () => {
    expect(
      buildAppointmentCancellation(cancelledBy(MENTOR_ID), MENTOR_ID)
        .cancelledAt,
    ).toBe(NOW.toISOString());
    expect(
      buildAppointmentCancellation(
        createAppointmentRecord({
          status: { title: 'CANCELLED' },
          cancelledById: MENTOR_ID,
        }),
        MENTOR_ID,
      ).cancelledAt,
    ).toBeNull();
  });
});
