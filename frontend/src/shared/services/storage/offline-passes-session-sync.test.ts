import '@/shared/testing/indexed-db.mock';
import { describe, expect, it } from 'vitest';
import { OFFLINE_PASSES_OWNER_KEY, offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { readIndexedDb, writeIndexedDb } from './browser-indexed-db';
import { syncOfflinePassesSession } from './offline-passes-session-sync';

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

async function seed(userId: string) {
  await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, userId);
  await writeIndexedDb(offlinePassesKey(userId), { userId, passes: [] });
}

describe('syncOfflinePassesSession', () => {
  it('clears the copy when a session ends', async () => {
    await seed('user-a');
    await syncOfflinePassesSession(token('user-a'), null);
    expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBeNull();
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
  });

  it("claims the copy for a different account and removes the previous user's passes", async () => {
    await seed('user-a');
    await syncOfflinePassesSession(token('user-a'), token('user-b'));
    expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('user-b');
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
  });

  it.each([
    ['the app opens without a session', null, null],
    ['a session starts', null, token('user-a')],
    ['the same token is reported again', token('user-a'), token('user-a')],
    ['the same user refreshes the token', token('user-a'), `${token('user-a')}2`],
    ['the new token has no user', token('user-a'), 'opaque-token'],
  ])('keeps the copy when %s', async (_, previous, current) => {
    await seed('user-a');
    await syncOfflinePassesSession(previous, current);
    expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBe('user-a');
    expect(await readIndexedDb(offlinePassesKey('user-a'))).not.toBeNull();
  });
});
