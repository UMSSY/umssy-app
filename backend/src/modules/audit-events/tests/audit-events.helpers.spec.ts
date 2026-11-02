import { describe, expect, it } from 'vitest';
import { buildAuditEventCode } from '../helpers/build-audit-event-code.js';
import { buildAuditEventsWhere } from '../helpers/build-audit-events-where.js';
import { toBoliviaDayRange } from '../helpers/to-bolivia-day-range.js';

const UUID = '5f1c2a8e-3b4d-4c6e-9f10-112233445566';

describe('toBoliviaDayRange', () => {
  it('incluye desde las 00:00 del día inicial hasta antes de las 00:00 del día siguiente al final, en hora de Bolivia', () => {
    expect(toBoliviaDayRange('2026-09-01', '2026-09-30')).toEqual({
      gte: new Date('2026-09-01T04:00:00.000Z'),
      lt: new Date('2026-10-01T04:00:00.000Z'),
    });
  });

  it('devuelve solo el límite indicado', () => {
    expect(toBoliviaDayRange('2026-09-01')).toEqual({ gte: new Date('2026-09-01T04:00:00.000Z') });
    expect(toBoliviaDayRange(undefined, '2026-09-01')).toEqual({ lt: new Date('2026-09-02T04:00:00.000Z') });
    expect(toBoliviaDayRange()).toEqual({});
  });
});

describe('buildAuditEventsWhere', () => {
  it('sin filtros no restringe la consulta', () => {
    expect(buildAuditEventsWhere({})).toEqual({});
  });

  it('combina con AND la búsqueda por código o nombre, la acción, el responsable y el periodo', () => {
    expect(buildAuditEventsWhere({ search: 'quispe', action: 'approved', responsibleId: UUID, from: '2026-09-22', to: '2026-09-22' })).toEqual({
      AND: [
        {
          OR: [
            { requestCode: { contains: 'quispe', mode: 'insensitive' } },
            { applicantName: { contains: 'quispe', mode: 'insensitive' } },
          ],
        },
        { action: { title: 'approved' } },
        { actorId: UUID },
        { occurredAt: { gte: new Date('2026-09-22T04:00:00.000Z'), lt: new Date('2026-09-23T04:00:00.000Z') } },
      ],
    });
  });

  it('el responsable Sistema filtra por el rol automático, no por un usuario', () => {
    expect(buildAuditEventsWhere({ responsibleId: 'system' })).toEqual({ AND: [{ actorRole: 'sistema' }] });
  });
});

describe('buildAuditEventCode', () => {
  it('usa el año de Bolivia y rellena el número con ceros', () => {
    expect(buildAuditEventCode(812, new Date('2026-09-22T15:58:00.000Z'))).toBe('EVT-2026-000812');
  });

  it('un evento del 31 de diciembre a las 22:00 en Bolivia lleva el año de Bolivia', () => {
    expect(buildAuditEventCode(1, new Date('2027-01-01T02:00:00.000Z'))).toBe('EVT-2026-000001');
  });
});
