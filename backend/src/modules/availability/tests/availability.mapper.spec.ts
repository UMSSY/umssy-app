import { describe, expect, it } from 'vitest';
import { AppointmentStatusTitle } from '../enums/appointment-status-title.enum.js';
import { AvailabilityMapper } from '../mappers/availability.mapper.js';
import type { AvailabilityBlockWithAppointmentDetail } from '../types/availability-block-with-appointment-detail.types.js';
import type { AvailabilityBlockWithAppointments } from '../types/availability-block-with-appointments.types.js';

const buildBlock = (statuses: string[] = []): AvailabilityBlockWithAppointments =>
  ({
    id: 'block-1',
    mentorId: 'mentor-1',
    startAt: new Date('2026-10-06T22:00:00.000Z'),
    endAt: new Date('2026-10-06T22:30:00.000Z'),
    seriesId: null,
    repeatUntil: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    updatedAt: new Date('2026-10-02T12:00:00.000Z'),
    appointments: statuses.map((title) => ({ status: { title } })),
  }) as AvailabilityBlockWithAppointments;

describe('AvailabilityMapper', () => {
  const mapper = new AvailabilityMapper();

  it('arma la respuesta con fechas en ISO UTC', () => {
    expect(mapper.toResponse(buildBlock())).toEqual({
      id: 'block-1',
      mentorId: 'mentor-1',
      startAt: '2026-10-06T22:00:00.000Z',
      endAt: '2026-10-06T22:30:00.000Z',
      state: 'free',
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-02T12:00:00.000Z',
    });
  });

  it('marca como free un bloque sin citas activas', () => {
    expect(mapper.toResponse(buildBlock()).state).toBe('free');
  });

  it('marca como confirmed un bloque con cita confirmada', () => {
    expect(mapper.toResponse(buildBlock([AppointmentStatusTitle.CONFIRMED])).state).toBe('confirmed');
  });

  it('muestra como confirmed un bloque con una cita pendiente heredada', () => {
    expect(mapper.toResponse(buildBlock([AppointmentStatusTitle.LEGACY_PENDING])).state).toBe('confirmed');
  });

  it('reconoce confirmaciones heredadas sin cambiar sus títulos', () => {
    expect(mapper.toResponse(buildBlock([AppointmentStatusTitle.LEGACY_CONFIRMED])).state).toBe('confirmed');
  });

  it('marca como free un bloque cuyas citas están canceladas o completadas', () => {
    const block = buildBlock([AppointmentStatusTitle.CANCELLED, AppointmentStatusTitle.COMPLETED]);
    expect(mapper.toResponse(block).state).toBe('free');
  });

  it('marca como confirmed un bloque si al menos una de sus citas está activa', () => {
    const block = buildBlock([AppointmentStatusTitle.CANCELLED, AppointmentStatusTitle.CONFIRMED]);
    expect(mapper.toResponse(block).state).toBe('confirmed');
  });

  it('mapea una lista manteniendo el orden', () => {
    const second = { ...buildBlock([AppointmentStatusTitle.CONFIRMED]), id: 'block-2' };
    const result = mapper.toResponseList([buildBlock(), second]);
    expect(result.map((block) => [block.id, block.state])).toEqual([
      ['block-1', 'free'],
      ['block-2', 'confirmed'],
    ]);
  });

  describe('toOwnerResponse', () => {
    const appointment = {
      id: 'appointment-1',
      status: { title: AppointmentStatusTitle.CONFIRMED },
      student: { id: 'student-1', firstName: 'Luis', lastName: 'Flores' },
      orientationType: { id: 'orientation-1', name: 'Orientación profesional' },
    };
    const ownerBlock = (appointments: (typeof appointment)[] = []) =>
      ({ ...buildBlock(), appointments }) as unknown as AvailabilityBlockWithAppointmentDetail;

    it('agrega quién reservó y el tema a un bloque con cita confirmada', () => {
      expect(mapper.toOwnerResponse(ownerBlock([appointment]))).toEqual({
        ...mapper.toResponse(buildBlock([AppointmentStatusTitle.CONFIRMED])),
        appointment: {
          id: 'appointment-1',
          counterpart: { id: 'student-1', fullName: 'Luis Flores' },
          orientationType: { id: 'orientation-1', name: 'Orientación profesional' },
        },
      });
    });

    it('deja appointment en null en un bloque libre', () => {
      const result = mapper.toOwnerResponse(ownerBlock());
      expect(result.state).toBe('free');
      expect(result.appointment).toBeNull();
    });

    it('acepta una cita sin tema registrado', () => {
      const result = mapper.toOwnerResponse(ownerBlock([{ ...appointment, orientationType: null as never }]));
      expect(result.appointment?.orientationType).toBeNull();
    });

    it('mapea una lista manteniendo el orden', () => {
      const result = mapper.toOwnerResponseList([ownerBlock(), { ...ownerBlock([appointment]), id: 'block-2' }]);
      expect(result.map((block) => [block.id, block.appointment?.counterpart.fullName ?? null])).toEqual([
        ['block-1', null],
        ['block-2', 'Luis Flores'],
      ]);
    });
  });

  it('arma la respuesta de borrado solo con el id del bloque', () => {
    expect(mapper.toDeletedResponse(buildBlock())).toEqual({ id: 'block-1' });
  });
});
