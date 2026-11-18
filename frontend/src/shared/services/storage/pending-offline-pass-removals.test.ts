import '@/shared/testing/indexed-db.mock';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pendingPassRemovalsKey } from '@/shared/constants/offline-passes.constants';
import { updateIndexedDbPair } from './browser-indexed-db';
import {
  addPendingPassRemoval,
  clearPendingPassRemovals,
  readPendingPassRemovals,
} from './pending-offline-pass-removals';
import { removeOfflinePassOrDefer } from './remove-offline-pass';
import { saveAccessToken } from './access-token-storage';

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('pending offline pass removals', () => {
  it('keeps one entry per registration and per user', () => {
    addPendingPassRemoval('user-a', 'reg-1');
    addPendingPassRemoval('user-a', 'reg-1');
    addPendingPassRemoval('user-a', 'reg-2');

    expect(readPendingPassRemovals('user-a')).toEqual(['reg-1', 'reg-2']);
    expect(readPendingPassRemovals('user-b')).toEqual([]);
  });

  it('clears only the given registrations and drops the key when empty', () => {
    addPendingPassRemoval('user-a', 'reg-1');
    addPendingPassRemoval('user-a', 'reg-2');

    clearPendingPassRemovals('user-a', ['reg-1']);
    expect(readPendingPassRemovals('user-a')).toEqual(['reg-2']);

    clearPendingPassRemovals('user-a', ['reg-2']);
    expect(localStorage.getItem(pendingPassRemovalsKey('user-a'))).toBeNull();
  });

  it.each(['not json', '{"id":"reg-1"}', '["reg-1", 3, null]'])(
    'ignores corrupted stored values: %s',
    (raw) => {
      localStorage.setItem(pendingPassRemovalsKey('user-a'), raw);
      expect(readPendingPassRemovals('user-a')).toEqual(
        raw.startsWith('[') ? ['reg-1'] : [],
      );
    },
  );
});

describe('removeOfflinePassOrDefer', () => {
  it('reports a completed local removal', async () => {
    await saveAccessToken(token('user-a'));
    await expect(removeOfflinePassOrDefer('reg-1', token('user-a'))).resolves.toBe(true);
    expect(readPendingPassRemovals('user-a')).toEqual([]);
  });

  it('defers the removal when the local storage fails', async () => {
    await saveAccessToken(token('user-a'));
    vi.mocked(updateIndexedDbPair).mockRejectedValueOnce(new Error('blocked'));

    await expect(removeOfflinePassOrDefer('reg-1', token('user-a'))).resolves.toBe(false);
    expect(readPendingPassRemovals('user-a')).toEqual(['reg-1']);
  });
});
