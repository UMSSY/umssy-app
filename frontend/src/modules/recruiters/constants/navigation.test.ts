import { describe, it, expect } from 'vitest';
import * as navigationConstants from './navigation';

describe('Navigation Constants', () => {
  it('debe existir el archivo y exportar la configuración', () => {
    expect(navigationConstants).toBeDefined();
  });
});
