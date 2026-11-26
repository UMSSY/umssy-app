import '@/shared/testing/indexed-db.mock';
import { afterEach, expect, it, vi } from 'vitest';
import { saveAccessToken, clearAccessToken } from './access-token-storage';
import { withOfflineSessionCopy } from './offline-session-copy';
import * as database from './browser-indexed-db';

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

afterEach(() => {
  vi.restoreAllMocks();
  clearAccessToken();
});

it('reopens saved data offline and isolates a different account', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken(token('account-a'));
  await withOfflineSessionCopy('test', token('account-a'), async () => ({
    name: 'Saved',
  }));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const fetchData = vi.fn();
  await expect(
    withOfflineSessionCopy('test', token('account-a'), fetchData),
  ).resolves.toEqual({ name: 'Saved' });
  expect(fetchData).not.toHaveBeenCalled();
  await saveAccessToken(token('account-b'));
  await expect(
    withOfflineSessionCopy('test', token('account-b'), fetchData),
  ).rejects.toThrow('Conéctate');
});

it('rejects a late response from an earlier session', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken(token('account-a'));
  await withOfflineSessionCopy('late', token('account-a'), async () => {
    await saveAccessToken(token('account-b'));
    return 'private';
  });
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('late', token('account-b'), vi.fn()),
  ).rejects.toThrow('Conéctate');
});

it('keeps online reads usable but rejects preparation when persistence fails', async () => {
  await saveAccessToken(token('account-a'));
  vi.spyOn(database, 'updateIndexedDbPair')
    .mockRejectedValueOnce(new Error('Storage full'))
    .mockRejectedValueOnce(new Error('Storage full'));
  await expect(
    withOfflineSessionCopy('quota', token('account-a'), async () => 'live'),
  ).resolves.toBe('live');
  await expect(
    withOfflineSessionCopy('quota', token('account-a'), async () => 'live', {
      requireStorage: true,
    }),
  ).rejects.toThrow('Storage full');
});

it('does not overwrite a saved copy with a canceled response', async () => {
  await saveAccessToken(token('account-a'));
  await withOfflineSessionCopy('cancel', token('account-a'), async () => 'saved');
  const controller = new AbortController();
  await expect(
    withOfflineSessionCopy(
      'cancel',
      token('account-a'),
      async () => {
        controller.abort();
        return 'late';
      },
      { signal: controller.signal },
    ),
  ).rejects.toThrow();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('cancel', token('account-a'), vi.fn()),
  ).resolves.toBe('saved');
});

it('prepares and reads a copy without persisting its authentication token', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const credential = token('owner-a');
  await saveAccessToken(credential);
  await withOfflineSessionCopy('safe', credential, async () => 'saved', { requireStorage: true });
  const copy = await database.readIndexedDb('umssy:session-draft:offline:safe');
  expect(copy).toEqual({ userId: 'owner-a', data: 'saved' });
  expect(await database.readIndexedDb('accessToken')).toBeNull();
  expect(JSON.stringify(copy)).not.toContain(credential);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(withOfflineSessionCopy('safe', credential, vi.fn())).resolves.toBe('saved');
  clearAccessToken();
  await expect(withOfflineSessionCopy('safe', credential, vi.fn())).rejects.toThrow('Conéctate');
});

it('does not prepare data without a valid in-memory identity', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken('invalid-token');
  await expect(withOfflineSessionCopy('invalid', 'invalid-token', async () => 'live')).resolves.toBe('live');
  await expect(withOfflineSessionCopy('invalid', 'invalid-token', async () => 'live', { requireStorage: true })).rejects.toThrow('La sesión cambió');
  expect(await database.readIndexedDb('umssy:session-draft:offline:invalid')).toBeNull();
});

it('migrates a legacy copy only for its current in-memory account', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const credential = token('legacy-a');
  await saveAccessToken(credential);
  await database.writeIndexedDb('umssy:session-draft:offline:legacy', { token: credential, data: 'saved' });
  await expect(withOfflineSessionCopy('legacy', credential, vi.fn())).resolves.toBe('saved');
  expect(await database.readIndexedDb('umssy:session-draft:offline:legacy')).toEqual({ userId: 'legacy-a', data: 'saved' });
  await saveAccessToken(token('legacy-b'));
  await expect(withOfflineSessionCopy('legacy', token('legacy-b'), vi.fn())).rejects.toThrow('Conéctate');
});

it('keeps a data key named owner separate from the ownership marker', async () => {
  await saveAccessToken(token('owner-a'));
  await withOfflineSessionCopy('owner', token('owner-a'), async () => 'saved');
  expect(await database.readIndexedDb('umssy:session-draft:offline:owner')).toEqual({ userId: 'owner-a', data: 'saved' });
});
