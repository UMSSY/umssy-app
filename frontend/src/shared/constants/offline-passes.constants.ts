export const OFFLINE_PASSES_STORAGE_KEY = 'events:offline-passes';
export const OFFLINE_PASSES_KEY_PREFIX = 'offline-passes:';
export const offlinePassesKey = (userId: string) =>
  `${OFFLINE_PASSES_KEY_PREFIX}${userId}`;
