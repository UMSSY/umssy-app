import {
  readIndexedDb,
  removeIndexedDb,
  removeIndexedDbByPrefix,
  writeIndexedDb,
} from "@/shared/services/storage/browser-indexed-db";
import {
  OFFLINE_PASSES_KEY_PREFIX,
  OFFLINE_QR_TOKEN_PATTERN,
} from "../constants/offline-passes.constants";

import type { OfflinePass } from "../types/offline-pass.types";
import type { OfflinePassesSnapshot } from "../types/offline-passes-snapshot.types";
import type { OfflinePassesStore } from "../types/offline-passes-store.types";

const keyFor = (userId: string) => `${OFFLINE_PASSES_KEY_PREFIX}${userId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isText = (value: unknown): value is string => typeof value === "string";

function toOfflinePass(value: unknown): OfflinePass | null {
  if (!isRecord(value)) return null;
  const { id, eventName, date, startTime, endTime, location, status, qrToken } = value;
  if (![id, eventName, date, startTime, endTime, status].every(isText)) return null;
  if (location !== null && !isText(location)) return null;
  if (!isText(qrToken) || !OFFLINE_QR_TOKEN_PATTERN.test(qrToken)) return null;
  return {
    id: id as string,
    eventName: eventName as string,
    date: date as string,
    startTime: startTime as string,
    endTime: endTime as string,
    location,
    status: status as string,
    qrToken,
  };
}

function toSnapshot(value: unknown, userId: string): OfflinePassesSnapshot | null {
  if (!isRecord(value) || value.userId !== userId) return null;
  if (!isText(value.savedAt) || Number.isNaN(Date.parse(value.savedAt))) return null;
  if (!Array.isArray(value.passes)) return null;
  const passes = value.passes.map(toOfflinePass).filter((pass) => pass !== null);
  return { userId, savedAt: value.savedAt, passes };
}

export const offlinePassesStore: OfflinePassesStore = {
  async save(userId, passes) {
    const snapshot: OfflinePassesSnapshot = {
      userId,
      savedAt: new Date().toISOString(),
      passes: passes.map((pass) => toOfflinePass(pass)).filter((pass) => pass !== null),
    };
    await writeIndexedDb(keyFor(userId), snapshot);
  },
  async load(userId) {
    try {
      return toSnapshot(await readIndexedDb<unknown>(keyFor(userId)), userId);
    } catch {
      return null;
    }
  },
  clearUser: (userId) => removeIndexedDb(keyFor(userId)),
  clearAll: () => removeIndexedDbByPrefix(OFFLINE_PASSES_KEY_PREFIX),
};
