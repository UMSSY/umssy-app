import { describe, expect, it } from 'vitest';
import { toDocumentReplacedAuditEvent } from '../mappers/access-request-audit-event.mapper.js';
import { correctionSnapshot } from './document-correction.fixture.js';

describe('Auditoría de documento reemplazado', () => {
  it('protege el archivo anterior como evidencia y relaciona el archivo nuevo sin guardar contenido ni credenciales', () => {
    const result = toDocumentReplacedAuditEvent(correctionSnapshot(), 'file-new');
    expect(result).toEqual({
      accessRequestId: 'request-1', requestCode: 'SOL-2026-0139', applicantName: 'Ana Pérez',
      applicantCareer: 'Licenciatura en Ingeniería de Sistemas', action: 'document_replaced',
      actor: { id: null, name: 'Ana Pérez', role: 'titulado' }, evidenceFileId: 'file-old',
      detail: 'Documento anterior sustituido. Nuevo documento: file-new.',
    });
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('content');
    expect(result).not.toHaveProperty('occurredAt');
  });

  it('no inventa un archivo anterior si no estaba disponible', () => {
    expect(toDocumentReplacedAuditEvent(correctionSnapshot({ documentFileId: null }), 'file-new').evidenceFileId).toBeNull();
  });
});
