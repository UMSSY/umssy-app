import { authService } from '@/modules/auth';
import { prepareOfflineShell } from '@/shared/services/service-worker/prepare-offline-shell';
import { prepareOfflinePasses } from './prepare-offline-passes';
import { prepareOfflineEvents } from './prepare-offline-events';

export async function prepareOfflineAccess(token: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  const cancelled = new Promise<never>((_, reject) => {
    controller.signal.addEventListener(
      'abort',
      () => reject(controller.signal.reason),
      { once: true },
    );
  });
  const timeout = setTimeout(() => {
    controller.abort(new Error('La descarga tardó demasiado. Reintenta.'));
  }, 60_000);
  try {
    await Promise.race([
      Promise.all([
        prepareOfflineShell(controller.signal),
        prepareOfflinePasses(token, controller.signal),
        prepareOfflineEvents(token, controller.signal),
        authService.getSession(token, controller.signal, true),
      ]),
      cancelled,
    ]);
    return true;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
    controller.abort();
  }
}
