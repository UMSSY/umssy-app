import '@/shared/testing/indexed-db.mock';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { readIndexedDb, writeIndexedDb } from './browser-indexed-db';
import { offlinePassesKey, OFFLINE_PASSES_OWNER_KEY } from '@/shared/constants/offline-passes.constants';
import {
  clearAccessToken,
  getAccessToken,
  initializeAccessTokenStorage,
  saveAccessToken,
  subscribeAccessToken,
  waitForAccessTokenWrites,
} from './access-token-storage';

describe("access token memory storage (no IndexedDB persistence)", () => {
  afterEach(async () => {
    await waitForAccessTokenWrites();
    vi.restoreAllMocks();
  });

  it("keeps token in memory without persisting it into IndexedDB, localStorage or sessionStorage", async () => {
    expect(await saveAccessToken("token-value")).toBe(true);
    expect(getAccessToken()).toBe("token-value");
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(Object.values(sessionStorage)).not.toContain("token-value");
    expect(Object.values(localStorage)).not.toContain("token-value");
  });

  it("removes any legacy token from IndexedDB during initialization", async () => {
    await writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, "legacy-token");
    vi.resetModules();
    const storage = await import('./access-token-storage');
    expect(storage.isAccessTokenReady()).toBe(false);
    await storage.initializeAccessTokenStorage();
    expect(storage.isAccessTokenReady()).toBe(true);
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(storage.getAccessToken()).toBeNull();
    storage.clearAccessToken();
    await storage.waitForAccessTokenWrites();
  });

  it('invalidates the in-memory snapshot immediately on logout', async () => {
    await saveAccessToken('token-value');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    await saveAccessToken("replacement");
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBe("replacement");
  });

  it('notifies subscribers after login and logout', async () => {
    await initializeAccessTokenStorage();
    const listener = vi.fn();
    const unsubscribe = subscribeAccessToken(listener);
    await saveAccessToken('token-a');
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    clearAccessToken();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  describe('offline passes of the device owner', () => {
    const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
    const seedOwner = async (userId: string) => {
      await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, userId);
      await writeIndexedDb(offlinePassesKey(userId), { userId, passes: [] });
    };

    it('keeps the copy when the same user signs in again', async () => {
      await seedOwner('user-a');
      await saveAccessToken(token('user-a'));
      expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('user-a');
      expect(await readIndexedDb(offlinePassesKey('user-a'))).not.toBeNull();
    });

    it("removes the previous user's copy when another user signs in", async () => {
      await seedOwner('user-a');
      await saveAccessToken(token('user-b'));
      expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBeNull();
      expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    });

    it('removes the copy and its owner when the session ends', async () => {
      await saveAccessToken(token('user-a'));
      await seedOwner('user-a');
      clearAccessToken();
      await vi.waitFor(async () =>
        expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBeNull(),
      );
      expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    });

    it('keeps the offline copy after a reload without restoring a persisted credential', async () => {
      await seedOwner('user-a');
      await writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, token('user-a'));
      vi.resetModules();
      const storage = await import('./access-token-storage');
      await storage.initializeAccessTokenStorage();
      expect(storage.getAccessToken()).toBeNull();
      expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
      expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('user-a');
      expect(await readIndexedDb(offlinePassesKey('user-a'))).not.toBeNull();
    });

    it('clears the offline copy on logout even when no token remains in memory', async () => {
      await seedOwner('user-a');
      vi.resetModules();
      const storage = await import('./access-token-storage');
      await storage.initializeAccessTokenStorage();
      expect(storage.getAccessToken()).toBeNull();
      storage.clearAccessToken();
      await storage.waitForAccessTokenWrites();
      expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBeNull();
      expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    });
  });
});

it('migrates legacy offline ownership before removing the persisted credential', async () => {
  const credential = `h.${btoa(JSON.stringify({ sub: 'legacy-a' }))}.s`;
  await writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, credential);
  await writeIndexedDb(offlinePassesKey('legacy-a'), { userId: 'legacy-a', passes: [] });
  vi.resetModules();
  const storage = await import('./access-token-storage');
  await storage.initializeAccessTokenStorage();
  expect(storage.getAccessToken()).toBeNull();
  expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('legacy-a');
  expect(await readIndexedDb(offlinePassesKey('legacy-a'))).not.toBeNull();
});

it('keeps the new account copy when an older logout finishes', async () => {
  const credential = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
  await saveAccessToken(credential('old-a'));
  await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, 'old-a');
  await writeIndexedDb(offlinePassesKey('old-a'), { userId: 'old-a', passes: [] });
  clearAccessToken();
  await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, 'new-b');
  await writeIndexedDb(offlinePassesKey('new-b'), { userId: 'new-b', passes: [] });
  await saveAccessToken(credential('new-b'));
  await waitForAccessTokenWrites();
  expect(getAccessToken()).toBe(credential('new-b'));
  expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('new-b');
  expect(await readIndexedDb(offlinePassesKey('new-b'))).not.toBeNull();
});
