import { describe, expect, it } from 'vitest';
import { auditEventsFiltersSchema } from '../requests/audit-events-filters.schema.js';
import { listAuditEventsQuerySchema } from '../requests/list-audit-events.schema.js';

const UUID = '5f1c2a8e-3b4d-4c6e-9f10-112233445566';

describe('listAuditEventsQuerySchema', () => {
  it('aplica página 1 y límite 10 por defecto y convierte textos vacíos en ausentes', () => {
    const result = listAuditEventsQuerySchema.parse({ search: '  ', action: '', responsibleId: '', from: '', to: '' });
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('acepta búsqueda, acción, responsable, periodo y paginación válidos', () => {
    const result = listAuditEventsQuerySchema.parse({
      search: ' SOL-2026 ',
      action: 'approved',
      responsibleId: UUID,
      from: '2026-09-01',
      to: '2026-09-30',
      page: '2',
      limit: '20',
    });
    expect(result).toEqual({ search: 'SOL-2026', action: 'approved', responsibleId: UUID, from: '2026-09-01', to: '2026-09-30', page: 2, limit: 20 });
  });

  it('acepta el responsable Sistema', () => {
    expect(listAuditEventsQuerySchema.parse({ responsibleId: 'system' }).responsibleId).toBe('system');
  });

  it.each([
    [{ action: 'deleted' }, 'action', 'La acción no es válida'],
    [{ responsibleId: 'carla' }, 'responsibleId', 'El responsable no es válido'],
    [{ search: 'a' }, 'search', 'La búsqueda debe tener al menos 2 caracteres'],
    [{ from: '01/09/2026' }, 'from', 'La fecha inicial debe tener el formato AAAA-MM-DD'],
    [{ to: '2026-02-30' }, 'to', 'La fecha final no existe'],
    [{ from: '2026-09-30', to: '2026-09-01' }, 'to', 'La fecha final no puede ser anterior a la fecha inicial'],
    [{ limit: '51' }, 'limit', 'El límite no puede superar 50'],
    [{ page: '0' }, 'page', 'La página debe ser mayor o igual a 1'],
  ])('rechaza %o con un mensaje en español', (input, field, message) => {
    const result = listAuditEventsQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((item) => item.path.join('.') === field);
    expect(issue?.message).toBe(message);
  });

  it('permite un periodo de un solo día', () => {
    expect(listAuditEventsQuerySchema.safeParse({ from: '2026-09-22', to: '2026-09-22' }).success).toBe(true);
  });
});

describe('auditEventsFiltersSchema', () => {
  it('no incluye la paginación: la exportación usa todos los eventos filtrados', () => {
    expect(auditEventsFiltersSchema.parse({ page: '3', action: 'rejected' })).toEqual({ action: 'rejected' });
  });

  it('valida el periodo igual que el listado', () => {
    expect(auditEventsFiltersSchema.safeParse({ from: '2026-10-02', to: '2026-10-01' }).success).toBe(false);
  });
});
