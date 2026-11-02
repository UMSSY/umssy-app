import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocumentCorrectionToken, matchesDocumentCorrectionToken } from '../helpers/document-correction-token.js';
import { CORRECTION_TEST_SECRET, correctionContext } from './document-correction.fixture.js';

describe('Permiso de corrección documental', () => {
  afterEach(() => vi.useRealTimers());

  it('produce una firma opaca y permite validar la misma revisión', () => {
    const context = correctionContext();
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    expect(token).toMatch(/^dcr1\.[A-Za-z0-9_-]{43}$/);
    expect(token).not.toContain(context.requestCode);
    expect(token).not.toContain(context.accessRequestId);
    expect(matchesDocumentCorrectionToken(context, token, CORRECTION_TEST_SECRET)).toBe(true);
  });

  it('abrir, cerrar o volver otro día no consume el permiso ni lo vence por tiempo', () => {
    vi.useFakeTimers();
    const context = correctionContext();
    vi.setSystemTime(new Date('2026-10-28T13:00:00.000Z'));
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    vi.setSystemTime(new Date('2040-01-01T00:00:00.000Z'));
    expect(matchesDocumentCorrectionToken(context, token, CORRECTION_TEST_SECRET)).toBe(true);
    expect(createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET)).toBe(token);
  });

  it.each([
    { accessRequestId: 'another-request' },
    { requestCode: 'SOL-2026-9999' },
    { previousFileId: 'another-file' },
    { previousFileId: null },
    { revision: new Date('2026-10-28T12:00:00.001Z') },
  ])('no permite usar la firma con otro contexto: %j', (override) => {
    const context = correctionContext();
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    expect(matchesDocumentCorrectionToken(correctionContext(override), token, CORRECTION_TEST_SECRET)).toBe(false);
  });

  it('no reactiva un permiso antiguo cuando llega otro rechazo', () => {
    const initial = correctionContext();
    const oldToken = createDocumentCorrectionToken(initial, CORRECTION_TEST_SECRET);
    const next = correctionContext({ previousFileId: 'file-new', revision: new Date('2026-11-01T12:00:00.000Z') });
    expect(matchesDocumentCorrectionToken(next, oldToken, CORRECTION_TEST_SECRET)).toBe(false);
    expect(createDocumentCorrectionToken(next, CORRECTION_TEST_SECRET)).not.toBe(oldToken);
  });

  it('rotar la clave invalida la firma anterior', () => {
    const context = correctionContext();
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    expect(matchesDocumentCorrectionToken(context, token, 'different-test-key')).toBe(false);
  });

  it.each([undefined, null, '', 123, {}, [], 'Bearer dcr1.token', 'dcr1.short', `dcr1.${'x'.repeat(43)} `, `dcr1.${'é'.repeat(43)}`].map((token) => ({ token })))(
    'rechaza una credencial con formato inválido sin lanzar errores: $token', ({ token }) => {
      expect(matchesDocumentCorrectionToken(correctionContext(), token, CORRECTION_TEST_SECRET)).toBe(false);
    },
  );

  it('rechaza alteraciones de la firma aun con longitud y prefijo correctos', () => {
    const context = correctionContext();
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    expect(matchesDocumentCorrectionToken(context, tampered, CORRECTION_TEST_SECRET)).toBe(false);
  });

  it('admite una revisión sin archivo previo sin confundirla con otra revisión', () => {
    const context = correctionContext({ previousFileId: null });
    const token = createDocumentCorrectionToken(context, CORRECTION_TEST_SECRET);
    expect(matchesDocumentCorrectionToken(context, token, CORRECTION_TEST_SECRET)).toBe(true);
  });
});
