import { describe, expect, it } from 'vitest';
import {
  createCompanyCorrectionToken,
  matchesCompanyCorrectionToken,
} from '../helpers/company-document-correction-token.js';
import {
  companyCorrectionContext,
  CORRECTION_SECRET,
} from './company-document-correction.fixture.js';

describe('company document correction token', () => {
  const context = companyCorrectionContext();

  it('genera un token ccr1 estable para la misma revisión', () => {
    const token = createCompanyCorrectionToken(context, CORRECTION_SECRET);
    expect(token).toMatch(/^ccr1\.[A-Za-z0-9_-]{43}$/);
    expect(createCompanyCorrectionToken(context, CORRECTION_SECRET)).toBe(token);
  });

  it('acepta solo el token de la misma revisión', () => {
    const token = createCompanyCorrectionToken(context, CORRECTION_SECRET);
    expect(matchesCompanyCorrectionToken(context, token, CORRECTION_SECRET)).toBe(true);
  });

  it.each([
    ['otro archivo', { previousFileId: 'file-2' }],
    ['otra revisión', { revision: new Date('2026-11-21T15:00:00.000Z') }],
    ['otro código', { requestCode: 'EMP-2026-0002' }],
    ['otra solicitud', { requestId: 'request-2' }],
  ])('deja de coincidir con %s', (_label, change) => {
    const token = createCompanyCorrectionToken(context, CORRECTION_SECRET);
    expect(
      matchesCompanyCorrectionToken(
        companyCorrectionContext(change),
        token,
        CORRECTION_SECRET,
      ),
    ).toBe(false);
  });

  it('rechaza otro secreto y tokens con formato inválido', () => {
    const token = createCompanyCorrectionToken(context, CORRECTION_SECRET);
    expect(matchesCompanyCorrectionToken(context, token, 'otro-secreto')).toBe(false);
    expect(matchesCompanyCorrectionToken(context, 'dcr1.' + token.slice(5), CORRECTION_SECRET)).toBe(false);
    expect(matchesCompanyCorrectionToken(context, undefined, CORRECTION_SECRET)).toBe(false);
    expect(matchesCompanyCorrectionToken(context, 'ccr1.corto', CORRECTION_SECRET)).toBe(false);
  });

  it('no coincide cuando el archivo previo es nulo y el token se emitió con archivo', () => {
    const token = createCompanyCorrectionToken(context, CORRECTION_SECRET);
    expect(
      matchesCompanyCorrectionToken(
        companyCorrectionContext({ previousFileId: null }),
        token,
        CORRECTION_SECRET,
      ),
    ).toBe(false);
  });
});
