import { describe, expect, it } from 'vitest';
import {
  formatUtcDate,
  formatUtcTime,
  mapEventToResponse,
  mapEventsToListResponse,
} from '../mappers/events.mapper.js';
import type { EventWithRelations } from '../types/events.types.js';

function buildRecord(overrides: Partial<EventWithRelations> = {}): EventWithRelations {
  return {
    id: 'uuid-1',
    title: 'Evento de prueba',
    description: 'Descripcion',
    eventDate: new Date('2026-06-15T00:00:00.000Z'),
    startTime: new Date('1970-01-01T09:00:00.000Z'),
    endTime: new Date('1970-01-01T11:30:00.000Z'),
    location: 'Sala A',
    capacity: 20,
    statusId: 'status-uuid',
    instructorName: 'Ana Lopez',
    modalityId: 'modality-uuid',
    supportThreshold: null,
    votingDeadline: null,
    status: { title: 'Publicado' },
    origin: { title: 'Institucional' },
    category: { id: 'cat-uuid', name: 'Tecnologia' },
    _count: { registrations: 5 },
    ...overrides,
  };
}

describe('formatUtcDate', () => {
  it('formatea una fecha UTC como YYYY-MM-DD', () => {
    expect(formatUtcDate(new Date('2026-06-15T00:00:00.000Z'))).toBe('2026-06-15');
  });

  it('rellena con ceros el mes y dia', () => {
    expect(formatUtcDate(new Date('2026-01-03T00:00:00.000Z'))).toBe('2026-01-03');
  });
});

describe('formatUtcTime', () => {
  it('formatea hora UTC como HH:mm', () => {
    expect(formatUtcTime(new Date('1970-01-01T09:05:00.000Z'))).toBe('09:05');
  });

  it('maneja medianoche correctamente', () => {
    expect(formatUtcTime(new Date('1970-01-01T00:00:00.000Z'))).toBe('00:00');
  });
});

describe('mapEventToResponse', () => {
  it('mapea un registro al formato de respuesta', () => {
    const record = buildRecord();
    const result = mapEventToResponse(record, 15);

    expect(result).toEqual({
      id: 'uuid-1',
      title: 'Evento de prueba',
      description: 'Descripcion',
      eventDate: '2026-06-15',
      startTime: '09:00',
      endTime: '11:30',
      location: 'Sala A',
      capacity: 20,
      availableSpots: 15,
      registrationCount: 5,
      instructorName: 'Ana Lopez',
      modalityId: 'modality-uuid',
      category: { id: 'cat-uuid', name: 'Tecnologia' },
      statusId: 'status-uuid',
      status: 'Publicado',
      origin: 'Institucional',
      supportCount: 5,
      supportThreshold: null,
      supportsRemaining: null,
      progressPercent: null,
      votingDeadline: null,
      hasSupported: false,
    });
  });

  it('acepta availableSpots null cuando capacity es null', () => {
    const record = buildRecord({ capacity: null });
    const result = mapEventToResponse(record, null);
    expect(result.availableSpots).toBeNull();
    expect(result.capacity).toBeNull();
  });

  it('maps instructorName as null when field is null', () => {
    const record = buildRecord({ instructorName: null });
    const result = mapEventToResponse(record, 0);
    expect(result.instructorName).toBeNull();
  });
});

describe('mapEventsToListResponse', () => {
  it('calcula offset y totalPages correctamente para lista paginada', () => {
    const records = [buildRecord()];
    const result = mapEventsToListResponse(records, 25, 3, 10);
    expect(result.offset).toBe(20);
    expect(result.page).toBe(3);
    expect(result.data.total).toBe(25);
    expect(result.data.limit).toBe(10);
    expect(result.data.totalPages).toBe(3);
    expect(result.data.items).toHaveLength(1);
  });

  it('calcula totalPages como 0 cuando total es 0', () => {
    const result = mapEventsToListResponse([], 0, 1, 10);
    expect(result.data.totalPages).toBe(0);
    expect(result.data.total).toBe(0);
    expect(result.data.items).toHaveLength(0);
  });

  it('calcula availableSpots correctamente', () => {
    const record = buildRecord({ capacity: 20, _count: { registrations: 5 } });
    const result = mapEventsToListResponse([record], 1, 1, 10);
    expect(result.data.items[0].availableSpots).toBe(15);
    expect(result.data.items[0].registrationCount).toBe(5);
  });

  it('pone availableSpots en 0 cuando capacity esta llena', () => {
    const record = buildRecord({ capacity: 5, _count: { registrations: 5 } });
    const result = mapEventsToListResponse([record], 1, 1, 10);
    expect(result.data.items[0].availableSpots).toBe(0);
  });

  it('pone availableSpots null cuando capacity es null', () => {
    const record = buildRecord({ capacity: null, _count: { registrations: 3 } });
    const result = mapEventsToListResponse([record], 1, 1, 10);
    expect(result.data.items[0].availableSpots).toBeNull();
  });
});

describe('mapEventToResponse - apoyos', () => {
  it.each(['Votacion', 'En votación'])('preserves the HU4 response for status %s and the proposal cover', (title) => {
    const record = buildRecord({ status: { title }, coverMimeType: 'image/png' });
    expect(mapEventToResponse(record, 15)).toMatchObject({ status: 'voting', coverUrl: `/events/${record.id}/cover` });
  });

  it('calcula el progreso de una propuesta en votación', () => {
    const record = buildRecord({
      status: { title: 'Votacion' },
      origin: { title: 'Comunidad' },
      supportThreshold: 20,
      votingDeadline: new Date('2026-10-12T23:59:00.000Z'),
      capacity: 40,
      _count: { registrations: 14 },
    });

    expect(mapEventToResponse(record, 26)).toMatchObject({
      status: 'voting',
      origin: 'Comunidad',
      supportCount: 14,
      supportThreshold: 20,
      supportsRemaining: 6,
      progressPercent: 70,
      votingDeadline: '2026-10-12T23:59:00.000Z',
      hasSupported: false,
    });
  });

  it('marca hasSupported cuando el usuario tiene un apoyo registrado', () => {
    const record = buildRecord({ registrations: [{ id: 'reg-1' }] });
    expect(mapEventToResponse(record, 15).hasSupported).toBe(true);
  });

  it('respeta el umbral mínimo de 8 apoyos', () => {
    const record = buildRecord({
      supportThreshold: 8,
      _count: { registrations: 4 },
    });
    const result = mapEventToResponse(record, 16);
    expect(result.supportThreshold).toBe(8);
    expect(result.supportsRemaining).toBe(4);
    expect(result.progressPercent).toBe(50);
  });

  it('no deja apoyos restantes negativos ni pasa de 100%', () => {
    const record = buildRecord({
      supportThreshold: 20,
      _count: { registrations: 25 },
    });
    const result = mapEventToResponse(record, 0);
    expect(result.supportsRemaining).toBe(0);
    expect(result.progressPercent).toBe(100);
  });

  it('deja los campos de progreso en null cuando el umbral es 0', () => {
    const record = buildRecord({ supportThreshold: 0 });
    const result = mapEventToResponse(record, 15);
    expect(result.supportThreshold).toBeNull();
    expect(result.supportsRemaining).toBeNull();
    expect(result.progressPercent).toBeNull();
  });
});
