import { describe, expect, it, vi } from 'vitest';
import { AuditEventNotFoundException } from '../exceptions/index.js';
import { toAuditEventDetail } from '../mappers/audit-event-detail.mapper.js';
import { AuditEventsService } from '../services/audit-events.service.js';

const ROW = {
  id: 'evt-2',
  number: 812,
  occurredAt: new Date('2026-11-07T09:54:00.000Z'),
  accessRequestId: 'req-1',
  requestCode: 'SOL-2026-0018',
  applicantName: 'Xavier Daniel Soria Flores',
  applicantCareer: 'Ingeniería de Sistemas',
  actorId: 'user-1',
  actorName: 'Admin Uno',
  actorRole: 'administrativo',
  detail: 'Motivo: Documento ilegible',
  action: { title: 'rejected' },
  evidenceFile: {
    name: 'diploma-academico',
    extension: 'pdf',
    mimeType: 'application/pdf',
    size: 1258291,
  },
  accessRequest: {
    graduationYear: 2024,
    documentType: { title: 'Diploma académico' },
  },
};

describe('toAuditEventDetail', () => {
  it('arma el detalle con el código del evento y los datos de la persona titulada', () => {
    const detail = toAuditEventDetail(ROW as never);

    expect(detail.code).toBe('EVT-2026-000812');
    expect(detail.request).toEqual({ id: 'req-1', code: 'SOL-2026-0018' });
    expect(detail.applicant).toEqual({
      fullName: 'Xavier Daniel Soria Flores',
      career: 'Ingeniería de Sistemas',
      graduationYear: 2024,
    });
    expect(detail.responsible).toEqual({
      id: 'user-1',
      name: 'Admin Uno',
      role: 'administrativo',
    });
    expect(detail.documentType).toBe('Diploma académico');
    expect(detail.evidence?.size).toBe(1258291);
  });

  it('devuelve el motivo del rechazo sin el prefijo guardado en el evento', () => {
    expect(toAuditEventDetail(ROW as never).rejectionReason).toBe(
      'Documento ilegible',
    );
  });

  it('no devuelve motivo cuando la acción no es un rechazo', () => {
    const approved = {
      ...ROW,
      action: { title: 'approved' },
      detail: 'Aprobada automáticamente con 95% de coincidencia.',
    };

    expect(toAuditEventDetail(approved as never).rejectionReason).toBeNull();
  });

  it('devuelve evidencia nula cuando el evento no tiene archivo', () => {
    const withoutFile = { ...ROW, evidenceFile: null };

    expect(toAuditEventDetail(withoutFile as never).evidence).toBeNull();
  });

  it('devuelve tipo de documento nulo cuando la solicitud no lo tiene', () => {
    const withoutType = {
      ...ROW,
      accessRequest: { graduationYear: 2024, documentType: null },
    };

    expect(toAuditEventDetail(withoutType as never).documentType).toBeNull();
  });
});

describe('AuditEventsService.getDetail', () => {
  it('devuelve el detalle del evento', async () => {
    const repository = { findDetailById: vi.fn().mockResolvedValue(ROW) };
    const service = new AuditEventsService(repository as never, {} as never);

    await expect(service.getDetail('evt-2')).resolves.toMatchObject({
      id: 'evt-2',
      code: 'EVT-2026-000812',
    });
  });

  it('rechaza un evento inexistente', async () => {
    const repository = { findDetailById: vi.fn().mockResolvedValue(null) };
    const service = new AuditEventsService(repository as never, {} as never);

    await expect(service.getDetail('evt-x')).rejects.toThrow(
      AuditEventNotFoundException,
    );
  });
});
