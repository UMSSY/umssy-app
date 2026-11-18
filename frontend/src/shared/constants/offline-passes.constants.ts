export const OFFLINE_PASSES_STORAGE_KEY = 'events:offline-passes';
export const OFFLINE_PASSES_SNAPSHOT_QUERY_KEY = 'offline-passes-snapshot';
export const OFFLINE_PASSES_KEY_PREFIX = 'offline-passes:';
export const offlinePassesKey = (userId: string) =>
  `${OFFLINE_PASSES_KEY_PREFIX}${userId}`;
