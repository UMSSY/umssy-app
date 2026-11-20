import '@/shared/testing/indexed-db.mock';
import { describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { readIndexedDb } from './browser-indexed-db';
import {
  clearAccessToken,
  saveAccessToken,
  waitForAccessTokenWrites,
} from './access-token-storage';

describe('waitForAccessTokenWrites', () => {
  it('resolves after pending session writes finish', async () => {
    await saveAccessToken('token-a');
    clearAccessToken();
    await waitForAccessTokenWrites();
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
