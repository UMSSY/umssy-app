import { updateSessionOfflinePasses } from '../utils/offline-passes-store';
import { removeOfflinePass } from '@/shared/services/storage/remove-offline-pass';
import type { PassData } from '../types/pass-data.types';
import type { Registration } from '../types/registration.types';

export async function saveOfflinePass(
  pass: PassData,
  accessToken: string,
  signal?: AbortSignal,
): Promise<void> {
  if (
    pass.status !== 'Confirmada' ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  )
    return;

  const savedPass: PassData = {
    id: pass.id,
    qrToken: pass.qrToken,
    eventName: pass.eventName,
    date: pass.date,
    startTime: pass.startTime,
    endTime: pass.endTime,
    location: pass.location,
    status: pass.status,
  };
  await updateSessionOfflinePasses(accessToken, signal, (snapshot, userId) => ({
    userId,
    savedAt: new Date().toISOString(),
    passes: [
      ...(snapshot?.passes ?? []).filter(({ id }) => id !== pass.id),
      savedPass,
    ],
  }));
}

export async function reconcileOfflinePasses(
  registrations: Registration[],
  accessToken: string,
  signal: AbortSignal,
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return false;
  let removed = false;
  const current = new Map(
    registrations.map((registration) => [registration.id, registration]),
  );
  const updated = await updateSessionOfflinePasses(
    accessToken,
    signal,
    (snapshot) => {
      if (!snapshot?.passes.length) return;
      const passes = snapshot.passes.flatMap((pass) => {
        const live = current.get(pass.id);
        if (!live) return [];
        const { eventName, date, startTime, endTime, location } = live;
        return [
          {
            id: pass.id,
            qrToken: pass.qrToken,
            status: pass.status,
            eventName,
            date,
            startTime,
            endTime,
            location,
          },
        ];
      });
      removed = passes.length < snapshot.passes.length;
      return { ...snapshot, passes, savedAt: new Date().toISOString() };
    },
  );
  return Boolean(updated && removed);
}

export { removeOfflinePass };
