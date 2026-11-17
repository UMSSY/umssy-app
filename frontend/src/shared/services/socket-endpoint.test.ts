import { describe, expect, it, vi } from 'vitest';
import { resolveSocketEndpoint } from './socket-endpoint';

vi.mock('@/shared/config/env.config', () => ({
  ENV_CONFIG: { apiUrl: 'http://localhost:8080/api' },
}));

describe('resolveSocketEndpoint', () => {
  it('usa el origen de la URL de la API y la ruta de socket.io', () => {
    expect(resolveSocketEndpoint('https://api.umssy.app/api/v1')).toEqual({
      serverUrl: 'https://api.umssy.app',
      path: '/api/socket.io',
    });
  });

  it('toma la URL de la API de la configuración por defecto', () => {
    expect(resolveSocketEndpoint()).toEqual({
      serverUrl: 'http://localhost:8080',
      path: '/api/socket.io',
    });
  });

  it('devuelve la URL tal cual si no es válida', () => {
    expect(resolveSocketEndpoint('no-es-url')).toEqual({
      serverUrl: 'no-es-url',
      path: '/api/socket.io',
    });
  });
});