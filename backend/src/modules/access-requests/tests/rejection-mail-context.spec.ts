import { describe, expect, it } from 'vitest';
import { RejectionMailContextService } from '../mail/rejection-mail-context.service.js';

describe('RejectionMailContextService', () => {
  it('solo expone el ID dentro de la ejecución y conserva el resultado', async () => {
    const context = new RejectionMailContextService();
    expect(context.getCurrent()).toBeUndefined();
    const result = await context.run('request-1', async () => {
      await Promise.resolve();
      expect(context.getCurrent()).toEqual({ accessRequestId: 'request-1' });
      expect(Object.isFrozen(context.getCurrent())).toBe(true);
      return true;
    });
    expect(result).toBe(true);
    expect(context.getCurrent()).toBeUndefined();
  });

  it('aísla notificaciones concurrentes aunque terminen en orden inverso', async () => {
    const context = new RejectionMailContextService();
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const first = context.run('first', async () => {
      await gate;
      return context.getCurrent()?.accessRequestId;
    });
    const second = context.run('second', async () => {
      await Promise.resolve();
      expect(context.getCurrent()?.accessRequestId).toBe('second');
      releaseFirst();
      return context.getCurrent()?.accessRequestId;
    });
    expect(await Promise.all([first, second])).toEqual(['first', 'second']);
    expect(context.getCurrent()).toBeUndefined();
  });

  it('restaura el contexto exterior después de una ejecución anidada', () => {
    const context = new RejectionMailContextService();
    context.run('outer', () => {
      context.run('inner', () => expect(context.getCurrent()?.accessRequestId).toBe('inner'));
      expect(context.getCurrent()?.accessRequestId).toBe('outer');
    });
    expect(context.getCurrent()).toBeUndefined();
  });

  it('no conserva contexto después de un fallo asíncrono', async () => {
    const context = new RejectionMailContextService();
    await expect(context.run('failed', async () => {
      await Promise.resolve();
      throw new Error('simulado');
    })).rejects.toThrow('simulado');
    expect(context.getCurrent()).toBeUndefined();
  });
});
