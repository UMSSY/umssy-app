import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DocumentCorrectionGuard } from '../guards/document-correction.guard.js';
import { DocumentCorrectionUnauthorizedException } from '../exceptions/document-correction-unauthorized.exception.js';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import type { DocumentCorrectionRequest } from '../types/document-correction-request.types.js';
import { correctionContext } from './document-correction.fixture.js';

function build() {
  const request: Partial<DocumentCorrectionRequest> = {
    params: { code: 'SOL-2026-0139' }, headers: { authorization: 'Bearer signed-permission' },
  };
  const authorization = { authorize: vi.fn().mockResolvedValue(correctionContext()) };
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  const guard = new DocumentCorrectionGuard(authorization as unknown as DocumentCorrectionAuthorizationService);
  return { request, authorization, context, guard };
}

describe('DocumentCorrectionGuard', () => {
  it('autoriza antes del interceptor de carga y adjunta el contexto del servidor', async () => {
    const { request, authorization, context, guard } = build();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authorization.authorize).toHaveBeenCalledWith('SOL-2026-0139', 'Bearer signed-permission');
    expect(request.documentCorrection).toEqual(correctionContext());
  });

  it('no conserva un contexto anterior si falla una nueva autorización', async () => {
    const { request, authorization, context, guard } = build();
    request.documentCorrection = correctionContext();
    authorization.authorize.mockRejectedValue(new DocumentCorrectionUnauthorizedException());
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(DocumentCorrectionUnauthorizedException);
    expect(request.documentCorrection).toBeUndefined();
  });
});
