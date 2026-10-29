import { describe, expect, it, vi } from 'vitest';
import { DocumentReadingService } from '../services/document-reading.service.js';

const STATE = {
  id: 'req-1',
  firstName: 'María',
  lastName: 'Quispe Mamani',
  documentFileId: 'file-1',
  career: { title: 'Licenciatura en Ingeniería de Sistemas' },
  graduationYear: 2019,
  documentValidation: { result: 'queued' },
};

const DIPLOMA_TEXT = 'UNIVERSIDAD MAYOR DE SAN SIMÓN\nDIPLOMA ACADÉMICO\nMARÍA QUISPE MAMANI\nLICENCIATURA EN INGENIERÍA DE SISTEMAS\n2019';

function build(state: Record<string, unknown> | null = STATE) {
  const repository = { findAutomationState: vi.fn().mockResolvedValue(state) };
  const files = { getContent: vi.fn().mockResolvedValue({ name: 'diploma', extension: 'pdf', mimeType: 'application/pdf', content: Buffer.from('x') }) };
  const extractor = { extract: vi.fn().mockResolvedValue({ text: DIPLOMA_TEXT, confidence: 0.95 }) };
  const validation = { evaluateReading: vi.fn().mockResolvedValue({ result: 'auto_approved' }), markOcrFailed: vi.fn().mockResolvedValue(true) };
  const service = new DocumentReadingService(repository as never, files as never, extractor as never, validation as never);
  return { service, files, extractor, validation };
}

describe('DocumentReadingService', () => {
  it('lee el archivo real de la solicitud y entrega la lectura a la validación automática', async () => {
    const { service, files, extractor, validation } = build();
    const now = new Date('2026-10-28T12:00:00Z');
    await service.readAndEvaluate('req-1', now);
    expect(files.getContent).toHaveBeenCalledWith('file-1');
    expect(extractor.extract).toHaveBeenCalledOnce();
    expect(validation.evaluateReading).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({ isDiploma: true, fullName: 'maria quispe mamani', graduationYear: 2019 }),
      now,
      'file-1',
    );
  });

  it('no evalúa nada si la solicitud no tiene documento', async () => {
    const { service, validation } = build({ ...STATE, documentFileId: null });
    await expect(service.readAndEvaluate('req-1')).resolves.toBeNull();
    expect(validation.evaluateReading).not.toHaveBeenCalled();
  });
  it('deriva a revisión manual si el motor falla, sin evaluar ni rechazar', async () => {
    const { service, extractor, validation } = build();
    extractor.extract.mockRejectedValueOnce(new Error('model unavailable'));
    const now = new Date('2026-10-29T12:00:00Z');
    await expect(service.readAndEvaluate('req-1', now)).resolves.toBeNull();
    expect(validation.markOcrFailed).toHaveBeenCalledWith('req-1', 'file-1', now);
    expect(validation.evaluateReading).not.toHaveBeenCalled();
  });

  it('deriva a revisión manual si la lectura queda vacía', async () => {
    const { service, extractor, validation } = build();
    extractor.extract.mockResolvedValueOnce({ text: ' ', confidence: 0 });
    await service.readAndEvaluate('req-1');
    expect(validation.markOcrFailed).toHaveBeenCalledOnce();
    expect(validation.evaluateReading).not.toHaveBeenCalled();
  });

  it('no reprocesa una validación que ya terminó', async () => {
    const { service, extractor } = build({ ...STATE, documentValidation: { result: 'auto_approved' } });
    await expect(service.readAndEvaluate('req-1')).resolves.toBeNull();
    expect(extractor.extract).not.toHaveBeenCalled();
  });

});
