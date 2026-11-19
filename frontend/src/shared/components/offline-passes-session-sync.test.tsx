import '@/shared/testing/indexed-db.mock';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_PASSES_OWNER_KEY, offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import {
  clearAccessToken,
  initializeAccessTokenStorage,
  saveAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { readIndexedDb, writeIndexedDb } from '@/shared/services/storage/browser-indexed-db';
import { OfflinePassesSessionSync } from './offline-passes-session-sync';

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

afterEach(cleanup);

describe('OfflinePassesSessionSync', () => {
  it('removes the saved passes when the user signs out', async () => {
    await initializeAccessTokenStorage();
    await saveAccessToken(token('user-a'));
    render(<OfflinePassesSessionSync />);
    await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, 'user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), { userId: 'user-a', passes: [] });
    act(() => {
      clearAccessToken();
    });
    await vi.waitFor(async () =>
      expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull(),
    );
    expect(await readIndexedDb(OFFLINE_PASSES_OWNER_KEY)).toBeNull();
  });

  it('keeps the saved passes when the app starts without a session', async () => {
    await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, 'user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), { userId: 'user-a', passes: [] });
    render(<OfflinePassesSessionSync />);
    await act(async () => {
      await initializeAccessTokenStorage();
    });
    expect(await readIndexedDb(offlinePassesKey('user-a'))).not.toBeNull();
  });
});
