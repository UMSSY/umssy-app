import { describe, expect, it, vi } from 'vitest';
import { AUDIT_ACTION_LABELS } from '../constants/audit-action-labels.constants.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import { AuditEventTimelineService } from '../services/audit-event-timeline.service.js';

describe('AuditEventTimelineService', () => {
  it('devuelve el historial de la solicitud con acción, fecha y quién la realizó', async () => {
    const repository = {
      findTimeline: vi.fn().mockResolvedValue([
        { id: 'evt-1', occurredAt: new Date('2026-10-24T13:20:00Z'), actorName: 'María Quispe', actorRole: 'titulado', detail: null, action: { title: 'submitted' } },
        { id: 'evt-2', occurredAt: new Date('2026-10-24T13:21:00Z'), actorName: 'Sistema', actorRole: 'sistema', detail: 'Lectura OCR completada: 98% de coincidencia con los datos declarados.', action: { title: 'ocr_read' } },
      ]),
    };

    const timeline = await new AuditEventTimelineService(repository as any).listForRequest('req-1');

    expect(repository.findTimeline).toHaveBeenCalledWith('req-1');
    expect(timeline).toEqual([
      { id: 'evt-1', action: 'submitted', occurredAt: '2026-10-24T13:20:00.000Z', actorName: 'María Quispe', actorRole: 'titulado', detail: null },
      { id: 'evt-2', action: 'ocr_read', occurredAt: '2026-10-24T13:21:00.000Z', actorName: 'Sistema', actorRole: 'sistema', detail: 'Lectura OCR completada: 98% de coincidencia con los datos declarados.' },
    ]);
  });
});

describe('AuditEventsRepository.findTimeline', () => {
  it('lee los eventos de la solicitud del más antiguo al más reciente, sin archivos', async () => {
    const auditEvent = { findMany: vi.fn().mockResolvedValue([]) };
    await new AuditEventsRepository({ auditEvent } as any).findTimeline('req-1');
    const args = auditEvent.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ accessRequestId: 'req-1' });
    expect(args.orderBy).toEqual([{ occurredAt: 'asc' }, { number: 'asc' }]);
    expect(JSON.stringify(args.select)).not.toContain('evidence');
  });
});

describe('nuevas acciones de auditoría', () => {
  it('tienen etiqueta en español para el CSV', () => {
    expect(AUDIT_ACTION_LABELS.ocr_read).toBe('Lectura OCR');
    expect(AUDIT_ACTION_LABELS.sent_to_manual_review).toBe('Enviada a revisión manual');
    expect(AUDIT_ACTION_LABELS.approval_reverted).toBe('Aprobación revertida');
  });
});
