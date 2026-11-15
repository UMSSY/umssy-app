import { registrationsService } from './registrations.service';
import { updateSessionOfflinePasses } from '../utils/offline-passes-store';
import type { OfflinePass } from '../types/offline-pass.types';
import { reconcileOfflinePasses } from './offline-passes.service';

export async function prepareOfflinePasses(
  accessToken: string,
  signal: AbortSignal,
) {
  const registrations = await registrationsService.getMine(signal, accessToken);
  await reconcileOfflinePasses(registrations, accessToken, signal);
  const passes: OfflinePass[] = [];
  // Limit parallel requests on mobile connections.
  for (let offset = 0; offset < registrations.length; offset += 4) {
    signal.throwIfAborted();
    const batch = await Promise.all(
      registrations.slice(offset, offset + 4).map(async ({ id, location }) => ({
        ...(await registrationsService.getPass(id, signal, accessToken, false)),
        location,
      })),
    );
    passes.push(...batch);
  }
  const saved = await updateSessionOfflinePasses(
    accessToken,
    signal,
    (_, userId) => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false)
        return;
      return { userId, passes, savedAt: new Date().toISOString() };
    },
  );
  if (!saved)
    throw new Error('No se pudo guardar la copia de la sesión actual.');
  return saved;
}
