import '@/shared/testing/indexed-db.mock';
import { afterEach, expect, it, vi } from 'vitest';
import { saveAccessToken, clearAccessToken } from './access-token-storage';
import { withOfflineSessionCopy } from './offline-session-copy';
import * as database from './browser-indexed-db';

const accountA = `h.${btoa(JSON.stringify({ sub: 'user-a' }))}.s`;
const accountB = `h.${btoa(JSON.stringify({ sub: 'user-b' }))}.s`;

afterEach(() => {
  vi.restoreAllMocks();
  clearAccessToken();
});

it('reopens saved data offline and isolates a different account', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken(accountA);
  await withOfflineSessionCopy('test', accountA, async () => ({
    name: 'Saved',
  }));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const fetchData = vi.fn();
  await expect(
    withOfflineSessionCopy('test', accountA, fetchData),
  ).resolves.toEqual({ name: 'Saved' });
  expect(fetchData).not.toHaveBeenCalled();
  await saveAccessToken(accountB);
  await expect(
    withOfflineSessionCopy('test', accountB, fetchData),
  ).rejects.toThrow('Conéctate');
});

it('rejects a late response from an earlier session', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken(accountA);
  await withOfflineSessionCopy('late', accountA, async () => {
    await saveAccessToken(accountB);
    return 'private';
  });
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('late', accountB, vi.fn()),
  ).rejects.toThrow('Conéctate');
});

it('keeps online reads usable but rejects preparation when persistence fails', async () => {
  await saveAccessToken(accountA);
  vi.spyOn(database, 'writeIndexedDb')
    .mockRejectedValueOnce(new Error('Storage full'))
    .mockRejectedValueOnce(new Error('Storage full'));
  await expect(
    withOfflineSessionCopy('quota', accountA, async () => 'live'),
  ).resolves.toBe('live');
  await expect(
    withOfflineSessionCopy('quota', accountA, async () => 'live', {
      requireStorage: true,
    }),
  ).rejects.toThrow('Storage full');
});

it('does not overwrite a saved copy with a canceled response', async () => {
  await saveAccessToken(accountA);
  await withOfflineSessionCopy('cancel', accountA, async () => 'saved');
  const controller = new AbortController();
  await expect(
    withOfflineSessionCopy(
      'cancel',
      accountA,
      async () => {
        controller.abort();
        return 'late';
      },
      { signal: controller.signal },
    ),
  ).rejects.toThrow();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('cancel', accountA, vi.fn()),
  ).resolves.toBe('saved');
});

it('stores the user of the session instead of its token', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken(accountA);
  await withOfflineSessionCopy('owner', accountA, async () => 'data');
  const saved = await database.readIndexedDb<Record<string, unknown>>('umssy:session-draft:offline:owner');
  expect(saved).toEqual({ userId: 'user-a', data: 'data' });
  expect(JSON.stringify(saved)).not.toContain(accountA);
});

it('does not store copies for tokens without a user', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken('opaque-token');
  await expect(
    withOfflineSessionCopy('anonymous', 'opaque-token', async () => 'live'),
  ).resolves.toBe('live');
  expect(await database.readIndexedDb('umssy:session-draft:offline:anonymous')).toBeNull();
  await expect(
    withOfflineSessionCopy('anonymous', 'opaque-token', async () => 'live', { requireStorage: true }),
  ).rejects.toThrow('No se pudo guardar la copia sin conexión.');
});

it('reads a copy saved in the previous format when it belongs to the current token', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await saveAccessToken(accountA);
  await database.writeIndexedDb('umssy:session-draft:offline:legacy', { token: accountA, data: 'saved' });
  await expect(withOfflineSessionCopy('legacy', accountA, vi.fn())).resolves.toBe('saved');
  await vi.waitFor(async () =>
    expect(await database.readIndexedDb('umssy:session-draft:offline:legacy')).toEqual({ userId: 'user-a', data: 'saved' }),
  );
});

it('rejects a copy in the previous format that belongs to another token', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await saveAccessToken(accountB);
  await database.writeIndexedDb('umssy:session-draft:offline:legacy-b', { token: accountA, data: 'private' });
  await expect(withOfflineSessionCopy('legacy-b', accountB, vi.fn())).rejects.toThrow('Conéctate');
});

