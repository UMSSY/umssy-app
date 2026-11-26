import { describe, expect, it, vi } from 'vitest';
import { CompanyDocumentCorrectionGuard } from '../guards/company-document-correction.guard.js';
import { companyCorrectionContext } from './company-document-correction.fixture.js';

function executionContext(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

describe('CompanyDocumentCorrectionGuard', () => {
  it('guarda el contexto autorizado en la petición', async () => {
    const context = companyCorrectionContext();
    const authorization = { authorize: vi.fn().mockResolvedValue(context) };
    const request = {
      params: { code: 'EMP-2026-0001' },
      headers: { authorization: 'Bearer ccr1.x' },
      companyDocumentCorrection: companyCorrectionContext({ requestId: 'viejo' }),
    };

    await expect(
      new CompanyDocumentCorrectionGuard(authorization as never).canActivate(executionContext(request)),
    ).resolves.toBe(true);
    expect(authorization.authorize).toHaveBeenCalledWith('EMP-2026-0001', 'Bearer ccr1.x');
    expect(request.companyDocumentCorrection).toBe(context);
  });

  it('propaga el rechazo y no deja un contexto previo en la petición', async () => {
    const authorization = { authorize: vi.fn().mockRejectedValue(new Error('no autorizado')) };
    const request: Record<string, unknown> = {
      params: { code: 'EMP-2026-0001' },
      headers: {},
      companyDocumentCorrection: companyCorrectionContext(),
    };

    await expect(
      new CompanyDocumentCorrectionGuard(authorization as never).canActivate(executionContext(request)),
    ).rejects.toThrow('no autorizado');
    expect(request.companyDocumentCorrection).toBeUndefined();
  });
});
