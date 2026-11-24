import '@/shared/testing/indexed-db.mock';
import { describe, expect, it, vi } from 'vitest';
import { offlinePassesKey, pendingPassRemovalsKey } from '@/shared/constants/offline-passes.constants';
import { saveAccessToken } from './access-token-storage';
import { readIndexedDb, updateIndexedDbPair, writeIndexedDb } from './browser-indexed-db';
import { readLocalStorage, removeLocalStorage } from './browser-local-storage';
import { claimOfflinePasses } from './offline-passes-owner';
import { removeOfflinePass, removeOfflinePassOrDefer } from './remove-offline-pass';

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
const snapshot = (userId: string) => ({
  userId,
  savedAt: '2026-11-18T12:00:00.000Z',
  passes: [{ id: 'reg-1' }, { id: 'reg-2' }],
});

async function seed(userId: string) {
  await saveAccessToken(token(userId));
  await claimOfflinePasses(userId);
  await writeIndexedDb(offlinePassesKey(userId), snapshot(userId));
}

describe('removeOfflinePass', () => {
  it('removes a cancelled pass from the owner copy without the stored token', async () => {
    await seed('user-a');
    await removeOfflinePass('reg-1', token('user-a'));
    const saved = (await readIndexedDb(offlinePassesKey('user-a'))) as { passes: { id: string }[] };
    expect(saved.passes.map(({ id }) => id)).toEqual(['reg-2']);
  });

  it('does not touch a copy owned by another user', async () => {
    await seed('user-a');
    await saveAccessToken(token('user-b'));
    await writeIndexedDb(offlinePassesKey('user-a'), snapshot('user-a'));
    await removeOfflinePass('reg-1', token('user-b'));
    expect(await readIndexedDb(offlinePassesKey('user-b'))).toBeNull();
  });

  it('ignores tokens that are not the current session', async () => {
    await seed('user-a');
    await removeOfflinePass('reg-1', token('user-x'));
    const saved = (await readIndexedDb(offlinePassesKey('user-a'))) as { passes: unknown[] };
    expect(saved.passes).toHaveLength(2);
  });

  it('ignores invalid copies', async () => {
    await seed('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), { userId: 'user-b', passes: [] });
    await removeOfflinePass('reg-1', token('user-a'));
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toEqual({ userId: 'user-b', passes: [] });
    await writeIndexedDb(offlinePassesKey('user-a'), 'broken');
    await removeOfflinePass('reg-1', token('user-a'));
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBe('broken');
  });

  it('defers the removal when local storage fails', async () => {
    await seed('user-a');
    removeLocalStorage(pendingPassRemovalsKey('user-a'));
    vi.mocked(updateIndexedDbPair).mockRejectedValueOnce(new Error('blocked'));
    expect(await removeOfflinePassOrDefer('reg-1', token('user-a'))).toBe(false);
    expect(readLocalStorage(pendingPassRemovalsKey('user-a'))).toBe('["reg-1"]');
    expect(await removeOfflinePassOrDefer('reg-2', token('user-a'))).toBe(true);
  });
});
