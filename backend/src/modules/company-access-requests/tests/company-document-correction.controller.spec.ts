import { describe, expect, it, vi } from 'vitest';
import { CompanyDocumentCorrectionController } from '../controllers/company-document-correction.controller.js';
import { CompanyDocumentCorrectionUnauthorizedException } from '../exceptions/company-document-correction-unauthorized.exception.js';
import { companyCorrectionContext } from './company-document-correction.fixture.js';

describe('CompanyDocumentCorrectionController', () => {
  it('delega el reenvío con el contexto autorizado', async () => {
    const correction = { resubmit: vi.fn().mockResolvedValue({ requestCode: 'EMP-2026-0001', status: 'PENDING' }) };
    const controller = new CompanyDocumentCorrectionController(correction as never);
    const context = companyCorrectionContext();
    const file = { originalname: 'carta.pdf' } as never;

    await expect(
      controller.resubmit('EMP-2026-0001', { companyDocumentCorrection: context } as never, file),
    ).resolves.toEqual({ requestCode: 'EMP-2026-0001', status: 'PENDING' });
    expect(correction.resubmit).toHaveBeenCalledWith(context, file);
  });

  it('rechaza si el guard no dejó un contexto autorizado', () => {
    const correction = { resubmit: vi.fn() };
    const controller = new CompanyDocumentCorrectionController(correction as never);

    expect(() => controller.resubmit('EMP-2026-0001', {} as never, undefined)).toThrow(
      CompanyDocumentCorrectionUnauthorizedException,
    );
    expect(correction.resubmit).not.toHaveBeenCalled();
  });
});
