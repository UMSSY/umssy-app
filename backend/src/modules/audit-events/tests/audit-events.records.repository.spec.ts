import { describe, expect, it, vi } from 'vitest';
import { AUDIT_EVENT_ORDER } from '../constants/audit-event-selects.constants.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import type { RecordAuditEventInput } from '../types/record-audit-event-input.types.js';

const UUID = '5f1c2a8e-3b4d-4c6e-9f10-112233445566';

function build() {
  const auditEvent = {
    create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn(),
    findUnique: vi.fn().mockResolvedValue(null),
  };
  return { auditEvent, repository: new AuditEventsRepository({ auditEvent } as any) };
}

const INPUT: RecordAuditEventInput = {
  accessRequestId: 'req-1',
  requestCode: 'SOL-2026-0141',
  applicantName: 'Andrea Camacho',
  applicantCareer: 'Licenciatura en Ingeniería de Sistemas',
  action: 'approved',
  actor: { id: 'admin-1', name: 'Carla Montaño', role: 'administrativo' },
  detail: 'Documento revisado: Diploma académico.',
  evidenceFileId: 'file-1',
};

describe('AuditEventsRepository.create', () => {
  it('guarda la copia de los datos del momento y conecta solicitud, acción, responsable y evidencia', async () => {
    const { auditEvent, repository } = build();

    await repository.create(INPUT);

    const { data, select } = auditEvent.create.mock.calls[0][0];
    expect(data).toEqual({
      requestCode: 'SOL-2026-0141',
      applicantName: 'Andrea Camacho',
      applicantCareer: 'Licenciatura en Ingeniería de Sistemas',
      detail: 'Documento revisado: Diploma académico.',
      actorName: 'Carla Montaño',
      actorRole: 'administrativo',
      accessRequest: { connect: { id: 'req-1' } },
      action: { connectOrCreate: { where: { title: 'approved' }, create: { title: 'approved' } } },
      actor: { connect: { id: 'admin-1' } },
      evidenceFile: { connect: { id: 'file-1' } },
    });
    // La fecha la pone la base de datos, nunca el cliente
    expect(data.occurredAt).toBeUndefined();
    expect(select).toEqual({ id: true });
  });

  it('un evento del Sistema sin documento no conecta usuario ni archivo', async () => {
    const { auditEvent, repository } = build();

    await repository.create({ ...INPUT, actor: { id: null, name: 'Sistema', role: 'sistema' }, evidenceFileId: null });

    const { data } = auditEvent.create.mock.calls[0][0];
    expect(data.actor).toBeUndefined();
    expect(data.evidenceFile).toBeUndefined();
  });

  it('usa el cliente de la transacción cuando se le pasa', async () => {
    const { auditEvent, repository } = build();
    const tx = { auditEvent: { create: vi.fn().mockResolvedValue({ id: 'evt-2' }) } };

    await repository.create(INPUT, tx as any);

    expect(tx.auditEvent.create).toHaveBeenCalledOnce();
    expect(auditEvent.create).not.toHaveBeenCalled();
  });
});

describe('AuditEventsRepository: exportación', () => {
  it('findBatch usa el mismo filtro y orden del listado sin contar', async () => {
    const { auditEvent, repository } = build();

    await repository.findBatch({ filters: { responsibleId: UUID }, skip: 500, take: 500 });

    expect(auditEvent.findMany.mock.calls[0][0]).toMatchObject({ where: { AND: [{ actorId: UUID }] }, orderBy: AUDIT_EVENT_ORDER, skip: 500, take: 500 });
    expect(auditEvent.count).not.toHaveBeenCalled();
  });
});
