import { describe, expect, it, vi } from 'vitest';
import { AuditEventRecorderService } from '../services/audit-event-recorder.service.js';
import type { RecordAuditEventInput } from '../types/record-audit-event-input.types.js';

const INPUT: RecordAuditEventInput = {
  accessRequestId: 'req-1',
  requestCode: 'SOL-2026-0139',
  applicantName: 'Lucía Rojas',
  applicantCareer: 'Licenciatura en Ingeniería de Sistemas',
  action: 'rejected',
  actor: { id: 'admin-1', name: 'Carla Montaño', role: 'administrativo' },
  detail: 'Motivo: Documento ilegible',
  evidenceFileId: 'file-1',
};

describe('AuditEventRecorderService', () => {
  it('guarda el evento con el cliente de la transacción recibido', async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: 'evt-1' }) };
    const tx = {};
    await new AuditEventRecorderService(repository as any).record(INPUT, tx as any);
    expect(repository.create).toHaveBeenCalledWith(INPUT, tx);
  });

  it('recorta el detalle al largo máximo y no inventa un detalle vacío', async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: 'evt-1' }) };
    const recorder = new AuditEventRecorderService(repository as any);

    await recorder.record({ ...INPUT, detail: 'x'.repeat(600) });
    await recorder.record({ ...INPUT, detail: '' });

    expect(repository.create.mock.calls[0][0].detail).toHaveLength(500);
    expect(repository.create.mock.calls[1][0].detail).toBeNull();
  });

  it('si la base falla, propaga el error para que la transacción del dictamen se revierta', async () => {
    const boom = new Error('fallo de base');
    const repository = { create: vi.fn().mockRejectedValue(boom) };
    await expect(new AuditEventRecorderService(repository as any).record(INPUT, {} as any)).rejects.toBe(boom);
  });
});
