import { afterEach, describe, expect, it } from 'vitest';
import { OFFLINE_PASSES_ACTIVE_USER_KEY } from '@/shared/constants/offline-passes.constants';
import {
  activateOfflineUser,
  readActiveOfflineUser,
  revokeOfflineUser,
} from './offline-passes-session';

afterEach(() => localStorage.clear());

describe('offline passes session', () => {
  it('remembers the active user until it is revoked', () => {
    expect(readActiveOfflineUser()).toBeNull();
    activateOfflineUser('user-a');
    activateOfflineUser('user-a');
    expect(readActiveOfflineUser()).toBe('user-a');
    revokeOfflineUser();
    expect(readActiveOfflineUser()).toBeNull();
  });

  it('ignores blank values', () => {
    localStorage.setItem(OFFLINE_PASSES_ACTIVE_USER_KEY, '  ');
    expect(readActiveOfflineUser()).toBeNull();
  });
});
