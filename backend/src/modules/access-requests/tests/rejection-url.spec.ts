import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRejectionUrl } from '../mail/helpers/rejection-url.js';

const GRANT = { requestCode: 'SOL-2026-0001', token: `dcr1.${'x'.repeat(43)}` };

beforeEach(() => {
  vi.stubEnv('FRONTEND_URL', 'https://umssy.test/');
  vi.stubEnv('CORS_ORIGIN', undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('buildRejectionUrl', () => {
  it('entrega el código en query y el permiso solo en el fragmento', () => {
    const url = new URL(buildRejectionUrl(GRANT));
    expect(url.origin).toBe('https://umssy.test');
    expect(url.pathname).toBe('/request-access/status');
    expect([...url.searchParams]).toEqual([['code', GRANT.requestCode]]);
    expect(new URLSearchParams(url.hash.slice(1)).get('correctionToken')).toBe(GRANT.token);
    expect(url.search).not.toContain(GRANT.token);
    expect(url.toString()).not.toContain('email');
  });

  it('reutiliza el primer CORS_ORIGIN si no hay FRONTEND_URL', () => {
    vi.stubEnv('FRONTEND_URL', undefined);
    vi.stubEnv('CORS_ORIGIN', ' https://umssy.test,https://otro.test');
    expect(new URL(buildRejectionUrl(GRANT)).origin).toBe('https://umssy.test');
  });

  it('permite el entorno local existente', () => {
    vi.stubEnv('FRONTEND_URL', undefined);
    expect(new URL(buildRejectionUrl(GRANT)).origin).toBe('http://localhost:3000');
  });

  it('codifica el valor del código sin permitir añadir otros parámetros', () => {
    const code = 'SOL-2026-0001&email=externo@example.com#otro';
    const url = new URL(buildRejectionUrl({ ...GRANT, requestCode: code }));
    expect(url.searchParams.get('code')).toBe(code);
    expect(url.searchParams.has('email')).toBe(false);
    expect(new URLSearchParams(url.hash.slice(1)).get('correctionToken')).toBe(GRANT.token);
  });

  it.each(['ftp://umssy.test', 'javascript:alert(1)', 'mailto:ana@example.com', 'https://user:password@umssy.test', 'no-es-url'])(
    'rechaza un origen no admitido: %s', (origin) => {
      vi.stubEnv('FRONTEND_URL', origin);
      expect(() => buildRejectionUrl(GRANT)).toThrow();
    },
  );

  it.each(['', 'session.jwt', 'dcr1.short', `${GRANT.token}\n`])('rechaza un permiso inválido: %j', (token) => {
    expect(() => buildRejectionUrl({ ...GRANT, token })).toThrow();
  });

  it('no genera un enlace sin código de solicitud', () => {
    expect(() => buildRejectionUrl({ ...GRANT, requestCode: '' })).toThrow();
  });
});
