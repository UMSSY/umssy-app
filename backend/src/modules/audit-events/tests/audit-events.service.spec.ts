import { describe, expect, it, vi } from 'vitest';
import { FileNotFoundException } from '../../files/exceptions/index.js';
import {
  AuditEventNotFoundException,
  AuditEvidenceNotFoundException,
  AuditEvidenceUnavailableException,
} from '../exceptions/index.js';
import { toAuditEventListItem, toAuditResponsibleOptions } from '../mappers/audit-event.mapper.js';
import { AuditEventsService } from '../services/audit-events.service.js';

const ROW = {
  id: 'evt-1',
  number: 812,
  occurredAt: new Date('2026-09-22T15:41:00.000Z'),
  accessRequestId: 'req-1',
  requestCode: 'SOL-2026-0141',
  applicantName: 'Andrea Camacho',
  actorId: 'admin-1',
  actorName: 'Carla Montaño',
  actorRole: 'administrativo',
  detail: 'Documento revisado: Diploma académico.',
  action: { title: 'approved' },
  evidenceFile: { name: 'diploma', extension: 'pdf', mimeType: 'application/pdf', size: 1200 },
};

function build() {
  const repository = {
    findPage: vi.fn().mockResolvedValue({ rows: [ROW], total: 21 }),
    findResponsibles: vi.fn().mockResolvedValue({ people: [], hasSystemEvents: false }),
    findEvidenceReference: vi.fn(),
  };
  const files = { getContent: vi.fn() };
  return { repository, files, service: new AuditEventsService(repository as any, files as any) };
}

describe('toAuditEventListItem', () => {
  it('expone los campos de la HU sin datos de autenticación ni bytes del archivo', () => {
    expect(toAuditEventListItem(ROW as any)).toEqual({
      id: 'evt-1',
      code: 'EVT-2026-000812',
      occurredAt: '2026-09-22T15:41:00.000Z',
      request: { id: 'req-1', code: 'SOL-2026-0141' },
      applicantName: 'Andrea Camacho',
      action: 'approved',
      responsible: { id: 'admin-1', name: 'Carla Montaño', role: 'administrativo' },
      detail: 'Documento revisado: Diploma académico.',
      evidence: { name: 'diploma', extension: 'pdf', mimeType: 'application/pdf', size: 1200 },
    });
  });

  it('un evento sin documento lleva evidence en null, no un enlace ficticio', () => {
    expect(toAuditEventListItem({ ...ROW, evidenceFile: null } as any).evidence).toBeNull();
  });
});

describe('toAuditResponsibleOptions', () => {
  it('ordena por nombre, descarta actores sin identificador y agrega Sistema solo si hay eventos automáticos', () => {
    const people = [
      { actorId: 'b', actorName: 'Marco Rivera' },
      { actorId: null, actorName: 'Sin id' },
      { actorId: 'a', actorName: 'Carla Montaño' },
    ];
    expect(toAuditResponsibleOptions({ people, hasSystemEvents: true })).toEqual([
      { id: 'a', name: 'Carla Montaño' },
      { id: 'b', name: 'Marco Rivera' },
      { id: 'system', name: 'Sistema' },
    ]);
    expect(toAuditResponsibleOptions({ people: [], hasSystemEvents: false })).toEqual([]);
  });
});

describe('AuditEventsService', () => {
  it('list calcula el desplazamiento, pasa los filtros y devuelve items, total, page y limit', async () => {
    const { repository, service } = build();

    const result = await service.list({ page: 3, limit: 10, action: 'approved' });

    expect(repository.findPage).toHaveBeenCalledWith({ filters: { action: 'approved' }, skip: 20, take: 10 });
    expect(result.page).toBe(3);
    expect(result.offset).toBe(20);
    expect(result.data.total).toBe(21);
    expect(result.data.limit).toBe(10);
    expect(result.data.items[0].code).toBe('EVT-2026-000812');
  });

  it('listResponsibles devuelve las opciones del filtro', async () => {
    const { repository, service } = build();
    repository.findResponsibles.mockResolvedValue({ people: [{ actorId: 'a', actorName: 'Carla' }], hasSystemEvents: false });
    await expect(service.listResponsibles()).resolves.toEqual([{ id: 'a', name: 'Carla' }]);
  });

  it('getDocument sirve el archivo guardado en el evento', async () => {
    const { repository, files, service } = build();
    const file = { name: 'diploma', extension: 'pdf', mimeType: 'application/pdf', content: Buffer.from('%PDF') };
    repository.findEvidenceReference.mockResolvedValue({ id: 'evt-1', evidenceFileId: 'file-historico' });
    files.getContent.mockResolvedValue(file);

    await expect(service.getDocument('evt-1')).resolves.toBe(file);
    expect(files.getContent).toHaveBeenCalledWith('file-historico');
  });

  it('getDocument distingue evento inexistente, evento sin documento y archivo ya no disponible', async () => {
    const { repository, files, service } = build();

    repository.findEvidenceReference.mockResolvedValue(null);
    await expect(service.getDocument('evt-x')).rejects.toBeInstanceOf(AuditEventNotFoundException);

    repository.findEvidenceReference.mockResolvedValue({ id: 'evt-1', evidenceFileId: null });
    await expect(service.getDocument('evt-1')).rejects.toBeInstanceOf(AuditEvidenceNotFoundException);
    expect(files.getContent).not.toHaveBeenCalled();

    repository.findEvidenceReference.mockResolvedValue({ id: 'evt-1', evidenceFileId: 'file-1' });
    files.getContent.mockRejectedValue(new FileNotFoundException());
    await expect(service.getDocument('evt-1')).rejects.toBeInstanceOf(AuditEvidenceUnavailableException);
  });

  it('getDocument no oculta otros errores', async () => {
    const { repository, files, service } = build();
    const boom = new Error('fallo de base');
    repository.findEvidenceReference.mockResolvedValue({ id: 'evt-1', evidenceFileId: 'file-1' });
    files.getContent.mockRejectedValue(boom);
    await expect(service.getDocument('evt-1')).rejects.toBe(boom);
  });
});
