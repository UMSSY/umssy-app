import { describe, expect, it, vi } from 'vitest';
import { AUDIT_EVENT_ORDER } from '../constants/audit-event-selects.constants.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';

const UUID = '5f1c2a8e-3b4d-4c6e-9f10-112233445566';

function build() {
  const auditEvent = {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
  };
  return { auditEvent, repository: new AuditEventsRepository({ auditEvent } as any) };
}

describe('AuditEventsRepository: listado y evidencia', () => {
  it('findPage filtra, ordena de forma estable, pagina y cuenta sobre el mismo conjunto', async () => {
    const { auditEvent, repository } = build();
    auditEvent.findMany.mockResolvedValue([{ id: 'evt-1' }]);
    auditEvent.count.mockResolvedValue(11);

    const result = await repository.findPage({ filters: { action: 'rejected' }, skip: 10, take: 10 });

    const args = auditEvent.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ AND: [{ action: { title: 'rejected' } }] });
    expect(args.orderBy).toEqual(AUDIT_EVENT_ORDER);
    expect(args.skip).toBe(10);
    expect(args.take).toBe(10);
    expect(JSON.stringify(args.select)).not.toContain('content');
    expect(auditEvent.count).toHaveBeenCalledWith({ where: args.where });
    expect(result).toEqual({ rows: [{ id: 'evt-1' }], total: 11 });
  });

  it('findPage sin filtros devuelve una colección vacía con total cero', async () => {
    const { repository } = build();
    await expect(repository.findPage({ filters: {}, skip: 0, take: 10 })).resolves.toEqual({ rows: [], total: 0 });
  });

  it('findResponsibles devuelve una entrada por persona y avisa si hay eventos del Sistema', async () => {
    const { auditEvent, repository } = build();
    auditEvent.findMany.mockResolvedValue([{ actorId: UUID, actorName: 'Carla Montaño' }]);
    auditEvent.findFirst.mockResolvedValue({ id: 'evt-9' });

    await expect(repository.findResponsibles()).resolves.toEqual({
      people: [{ actorId: UUID, actorName: 'Carla Montaño' }],
      hasSystemEvents: true,
    });
    expect(auditEvent.findMany.mock.calls[0][0]).toMatchObject({ where: { actorId: { not: null } }, distinct: ['actorId'] });
    expect(auditEvent.findFirst.mock.calls[0][0].where).toEqual({ actorRole: 'sistema' });
  });

  it('findEvidenceReference solo lee la referencia al archivo', async () => {
    const { auditEvent, repository } = build();

    await repository.findEvidenceReference('evt-1');

    expect(auditEvent.findUnique).toHaveBeenCalledWith({ where: { id: 'evt-1' }, select: { id: true, evidenceFileId: true } });
  });
});
