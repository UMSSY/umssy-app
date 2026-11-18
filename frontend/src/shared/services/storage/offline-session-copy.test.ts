import '@/shared/testing/indexed-db.mock';
import { afterEach, expect, it, vi } from 'vitest';
import { saveAccessToken, clearAccessToken } from './access-token-storage';
import { withOfflineSessionCopy } from './offline-session-copy';
import * as database from './browser-indexed-db';

afterEach(() => {
  vi.restoreAllMocks();
  clearAccessToken();
});

it('reopens saved data offline and isolates a different account', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken('account-a');
  await withOfflineSessionCopy('test', 'account-a', async () => ({
    name: 'Saved',
  }));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const fetchData = vi.fn();
  await expect(
    withOfflineSessionCopy('test', 'account-a', fetchData),
  ).resolves.toEqual({ name: 'Saved' });
  expect(fetchData).not.toHaveBeenCalled();
  await saveAccessToken('account-b');
  await expect(
    withOfflineSessionCopy('test', 'account-b', fetchData),
  ).rejects.toThrow('Conéctate');
});

it('rejects a late response from an earlier session', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await saveAccessToken('account-a');
  await withOfflineSessionCopy('late', 'account-a', async () => {
    await saveAccessToken('account-b');
    return 'private';
  });
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('late', 'account-b', vi.fn()),
  ).rejects.toThrow('Conéctate');
});

it('keeps online reads usable but rejects preparation when persistence fails', async () => {
  await saveAccessToken('account-a');
  vi.spyOn(database, 'updateIndexedDbPair')
    .mockRejectedValueOnce(new Error('Storage full'))
    .mockRejectedValueOnce(new Error('Storage full'));
  await expect(
    withOfflineSessionCopy('quota', 'account-a', async () => 'live'),
  ).resolves.toBe('live');
  await expect(
    withOfflineSessionCopy('quota', 'account-a', async () => 'live', {
      requireStorage: true,
    }),
  ).rejects.toThrow('Storage full');
});

it('does not overwrite a saved copy with a canceled response', async () => {
  await saveAccessToken('account-a');
  await withOfflineSessionCopy('cancel', 'account-a', async () => 'saved');
  const controller = new AbortController();
  await expect(
    withOfflineSessionCopy(
      'cancel',
      'account-a',
      async () => {
        controller.abort();
        return 'late';
      },
      { signal: controller.signal },
    ),
  ).rejects.toThrow();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(
    withOfflineSessionCopy('cancel', 'account-a', vi.fn()),
  ).resolves.toBe('saved');
});
