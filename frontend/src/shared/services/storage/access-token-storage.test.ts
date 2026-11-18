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
} from './access-token-storage';

describe('access token IndexedDB storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists the token without copying it into browser web storage', async () => {
    expect(await saveAccessToken('token-value')).toBe(true);
    expect(getAccessToken()).toBe('token-value');
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBe('token-value');
    expect(Object.values(sessionStorage)).not.toContain('token-value');
    expect(Object.values(localStorage)).not.toContain('token-value');
  });

  it('hydrates the token before consumers read the session', async () => {
    await writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, 'persisted');
    vi.resetModules();
    const storage = await import('./access-token-storage');
    expect(storage.isAccessTokenReady()).toBe(false);
    await storage.initializeAccessTokenStorage();
    expect(storage.getAccessToken()).toBe('persisted');
    storage.clearAccessToken();
  });

  it('invalidates the in-memory snapshot immediately on logout', async () => {
    await saveAccessToken('token-value');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    await saveAccessToken('replacement');
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBe('replacement');
  });

  it('does not publish a login if durable persistence fails', async () => {
    await saveAccessToken('previous-session');
    clearAccessToken();
    await vi.waitFor(async () =>
      expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull(),
    );
    vi.mocked(writeIndexedDb).mockRejectedValueOnce(
      new Error('storage blocked'),
    );
    expect(await saveAccessToken('token-value')).toBe(false);
    expect(getAccessToken()).toBeNull();
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
  });
});

