import { describe, expect, it, vi } from 'vitest';
import { StreamableFile } from '@nestjs/common';
import { AUDIT_EXPORT_BATCH_SIZE } from '../constants/audit-events-export.constants.js';
import { AuditEventsController } from '../controllers/audit-events.controller.js';
import { formatBoliviaDateTime, toAuditEventCsvRow } from '../mappers/audit-event-csv.mapper.js';
import { AuditEventsExportService } from '../services/audit-events-export.service.js';

const row = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `evt-${index}`,
  number: index,
  occurredAt: new Date('2026-09-22T15:41:00.000Z'),
  accessRequestId: 'req-1',
  requestCode: 'SOL-2026-0141',
  applicantName: 'Andrea Camacho',
  actorId: null,
  actorName: 'Sistema',
  actorRole: 'sistema',
  detail: 'Código de activación enviado a an•••@gmail.com.',
  action: { title: 'activation_code_sent' },
  evidenceFile: null,
  ...overrides,
});

describe('toAuditEventCsvRow', () => {
  it('escribe fecha y hora de Bolivia en una columna y etiquetas en español', () => {
    expect(formatBoliviaDateTime('2026-09-22T15:41:00.000Z')).toBe('22/09/2026 11:41');
    expect(
      toAuditEventCsvRow({
        id: 'evt-1',
        code: 'EVT-2026-000001',
        occurredAt: '2026-09-22T15:41:00.000Z',
        request: { id: 'req-1', code: 'SOL-2026-0141' },
        applicantName: 'Andrea',
        action: 'approved',
        responsible: { id: 'a', name: 'Carla Montaño', role: 'administrativo' },
        detail: null,
        evidence: { name: 'diploma', extension: 'pdf', mimeType: 'application/pdf', size: 10 },
      }),
    ).toEqual(['22/09/2026 11:41', 'SOL-2026-0141', 'Aprobada', 'Carla Montaño (Administrativo)', '', 'diploma.pdf']);
  });
});

describe('AuditEventsExportService', () => {
  it('recorre todos los lotes con los mismos filtros hasta agotar el conjunto', async () => {
    const full = Array.from({ length: AUDIT_EXPORT_BATCH_SIZE }, (_, index) => row(index + 1));
    const repository = { findBatch: vi.fn().mockResolvedValueOnce(full).mockResolvedValueOnce([row(999)]) };

    const file = await new AuditEventsExportService(repository as any).exportCsv({ action: 'activation_code_sent' }, new Date('2026-10-22T12:00:00Z'));

    expect(repository.findBatch).toHaveBeenNthCalledWith(1, { filters: { action: 'activation_code_sent' }, skip: 0, take: AUDIT_EXPORT_BATCH_SIZE });
    expect(repository.findBatch).toHaveBeenNthCalledWith(2, { filters: { action: 'activation_code_sent' }, skip: AUDIT_EXPORT_BATCH_SIZE, take: AUDIT_EXPORT_BATCH_SIZE });
    expect(file.fileName).toBe('registro-auditoria-2026-10-22.csv');
    const lines = file.content.split('\r\n').filter((line) => line !== '');
    expect(lines).toHaveLength(AUDIT_EXPORT_BATCH_SIZE + 2);
    expect(lines[0]).toBe('﻿Fecha y hora,Solicitud,Acción,Responsable,Detalle,Evidencia');
    expect(lines[1]).toBe('22/09/2026 11:41,SOL-2026-0141,Código de activación enviado,Sistema (Proceso automático),Código de activación enviado a an•••@gmail.com.,Sin documento');
  });

  it('escapa comillas, comas y saltos de línea y neutraliza fórmulas', async () => {
    const repository = { findBatch: vi.fn().mockResolvedValue([row(1, { detail: '=HYPERLINK("x"), con coma\ny salto', actorName: '@admin' })]) };

    const { content } = await new AuditEventsExportService(repository as any).exportCsv({});

    expect(content).toContain(`"'=HYPERLINK(""x""), con coma\ny salto"`);
    expect(content).toContain(`'@admin (Proceso automático)`);
  });

  it('sin coincidencias devuelve un CSV válido solo con encabezados', async () => {
    const repository = { findBatch: vi.fn().mockResolvedValue([]) };
    const { content } = await new AuditEventsExportService(repository as any).exportCsv({ search: 'nadie' });
    expect(content).toBe('﻿Fecha y hora,Solicitud,Acción,Responsable,Detalle,Evidencia\r\n');
  });
});

describe('AuditEventsController: exportación', () => {
  it('la exportación devuelve un archivo CSV adjunto', async () => {
    const exporter = { exportCsv: vi.fn().mockResolvedValue({ fileName: 'registro-auditoria-2026-10-22.csv', content: 'a,b\r\n' }) };
    const controller = new AuditEventsController({} as any, exporter as any);

    const file = await controller.export({ action: 'approved' });
    expect(exporter.exportCsv).toHaveBeenCalledWith({ action: 'approved' });
    expect(file).toBeInstanceOf(StreamableFile);
    expect(file.getHeaders()).toMatchObject({ type: 'text/csv; charset=utf-8', disposition: 'attachment; filename="registro-auditoria-2026-10-22.csv"' });
  });
});
