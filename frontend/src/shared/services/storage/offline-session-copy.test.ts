import '@/shared/testing/indexed-db.mock';
import { afterEach, expect, it, vi } from 'vitest';
import { saveAccessToken, clearAccessToken } from './access-token-storage';
import { withOfflineSessionCopy } from './offline-session-copy';

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
