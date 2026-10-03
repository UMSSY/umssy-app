import { describe, expect, it } from 'vitest';
import { validateJwtEnv } from '../utils/validate-jwt-env.js';

const validEnv = { JWT_SECRET: 'secret', JWT_EXPIRES_IN: '8h', JWT_ALGORITHM: 'HS256' };

describe('validateJwtEnv', () => {
  it('no lanza cuando las tres variables estan definidas', () => {
    expect(() => validateJwtEnv(validEnv)).not.toThrow();
  });

  it.each(['JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_ALGORITHM'])(
    'lanza un error que nombra %s cuando falta',
    (name) => {
      const env = { ...validEnv, [name]: undefined };
      expect(() => validateJwtEnv(env)).toThrow(name);
    },
  );

  it('trata valores vacios o con solo espacios como faltantes', () => {
    expect(() => validateJwtEnv({ ...validEnv, JWT_EXPIRES_IN: '', JWT_ALGORITHM: '  ' })).toThrow(
      'JWT_EXPIRES_IN, JWT_ALGORITHM',
    );
  });

  it('lista todas las variables faltantes en un solo mensaje', () => {
    expect(() => validateJwtEnv({})).toThrow('JWT_SECRET, JWT_EXPIRES_IN, JWT_ALGORITHM');
  });
});
