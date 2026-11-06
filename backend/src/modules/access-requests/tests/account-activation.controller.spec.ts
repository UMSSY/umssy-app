import { describe, expect, it, vi } from 'vitest';
import { AccountActivationController } from '../controllers/account-activation.controller.js';

describe('AccountActivationController', () => {
  function build() {
    const service = {
      getStatus: vi.fn().mockResolvedValue({ state: 'ready' }),
      verify: vi.fn().mockResolvedValue({ valid: true }),
      activate: vi.fn().mockResolvedValue({ accessToken: 'jwt' }),
      resend: vi.fn().mockResolvedValue({ resendsRemaining: 2 }),
    };
    return { service, controller: new AccountActivationController(service as any) };
  }

  it('consulta el estado con el correo recibido', async () => {
    const { controller, service } = build();
    await expect(controller.getStatus({ email: 'ana@umss.test' })).resolves.toEqual({ state: 'ready' });
    expect(service.getStatus).toHaveBeenCalledWith('ana@umss.test');
  });

  it('verifica el código con correo y código', async () => {
    const { controller, service } = build();
    await controller.verify({ email: 'ana@umss.test', code: '482719' });
    expect(service.verify).toHaveBeenCalledWith('ana@umss.test', '482719');
  });

  it('activa la cuenta con correo, código y contraseña', async () => {
    const { controller, service } = build();
    await expect(controller.activate({ email: 'ana@umss.test', code: '482719', password: 'Jackson2026' })).resolves.toEqual({
      accessToken: 'jwt',
    });
    expect(service.activate).toHaveBeenCalledWith('ana@umss.test', '482719', 'Jackson2026');
  });

  it('reenvía el código al correo recibido', async () => {
    const { controller, service } = build();
    await controller.resend({ email: 'ana@umss.test' });
    expect(service.resend).toHaveBeenCalledWith('ana@umss.test');
  });

  it('expone rutas públicas bajo /account-activation, sin guards de sesión', () => {
    expect(Reflect.getMetadata('path', AccountActivationController)).toBe('account-activation');
    expect(Reflect.getMetadata('__guards__', AccountActivationController)).toBeUndefined();
    expect(Reflect.getMetadata('__guards__', AccountActivationController.prototype.activate)).toBeUndefined();
  });
});