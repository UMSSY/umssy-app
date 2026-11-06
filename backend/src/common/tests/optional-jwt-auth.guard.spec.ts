import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard.js';
import type { JwtAuthGuard } from '../guards/jwt-auth.guard.js';

function buildContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  } as unknown as ExecutionContext;
}

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;
  const canActivate = vi.fn();

  beforeEach(() => {
    canActivate.mockReset();
    guard = new OptionalJwtAuthGuard({
      canActivate,
    } as unknown as JwtAuthGuard);
  });

  it('deja pasar sin token y no llama al guard real', async () => {
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
    expect(canActivate).not.toHaveBeenCalled();
  });

  it('deja pasar si el header no es Bearer', async () => {
    await expect(guard.canActivate(buildContext('Basic abc'))).resolves.toBe(
      true,
    );
    expect(canActivate).not.toHaveBeenCalled();
  });

  it('delega en el guard real cuando hay token', async () => {
    canActivate.mockResolvedValue(true);
    const context = buildContext('Bearer abc');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(canActivate).toHaveBeenCalledWith(context);
  });

  it('deja pasar como anónimo si el token es inválido', async () => {
    canActivate.mockRejectedValue(new Error('token inválido'));

    await expect(guard.canActivate(buildContext('Bearer malo'))).resolves.toBe(
      true,
    );
  });
});