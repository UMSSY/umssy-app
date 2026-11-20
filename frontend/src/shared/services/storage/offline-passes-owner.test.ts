import '@/shared/testing/indexed-db.mock';
import { describe, expect, it, vi } from 'vitest';
import {
  OFFLINE_PASSES_OWNER_KEY,
  OFFLINE_PASSES_STORAGE_KEY,
  offlinePassesKey,
  pendingPassRemovalsKey,
} from '@/shared/constants/offline-passes.constants';
import { readIndexedDb, writeIndexedDb } from './browser-indexed-db';
import { readLocalStorage, writeLocalStorage } from './browser-local-storage';
import {
  claimOfflinePasses,
  clearOfflinePasses,
  endOfflinePassesSession,
  readOfflinePassesOwner,
  readOwnedOfflinePasses,
  updateOwnedOfflinePasses,
} from './offline-passes-owner';

const copy = (userId: string) => ({ userId, savedAt: '2026-11-18T12:00:00.000Z', passes: [] });

describe('offline passes owner', () => {
  it('starts without an owner', async () => {
    expect(await readOfflinePassesOwner()).toBeNull();
    expect(await readOwnedOfflinePasses('user-a')).toBeNull();
  });

  it('ignores owners that are not user ids', async () => {
    await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, '  ');
    expect(await readOfflinePassesOwner()).toBeNull();
    await writeIndexedDb(OFFLINE_PASSES_OWNER_KEY, 42);
    expect(await readOfflinePassesOwner()).toBeNull();
  });

  it('claims the copy for the first user and keeps it for the same user', async () => {
    await claimOfflinePasses('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    await claimOfflinePasses('user-a');
    expect(await readOfflinePassesOwner()).toBe('user-a');
    expect(await readOwnedOfflinePasses('user-a')).toEqual(copy('user-a'));
  });

  it("removes the previous user's copy and pending removals when another user claims it", async () => {
    await claimOfflinePasses('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    writeLocalStorage(pendingPassRemovalsKey('user-a'), '["reg-1"]');
    await claimOfflinePasses('user-b');
    expect(await readOfflinePassesOwner()).toBe('user-b');
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    expect(readLocalStorage(pendingPassRemovalsKey('user-a'))).toBeNull();
    expect(await readOwnedOfflinePasses('user-a')).toBeNull();
  });

  it('only updates the copy of the current owner', async () => {
    await claimOfflinePasses('user-a');
    expect(await updateOwnedOfflinePasses('user-a', () => copy('user-a'))).toBe(true);
    expect(await updateOwnedOfflinePasses('user-b', () => copy('user-b'))).toBe(false);
    expect(await updateOwnedOfflinePasses('user-a', () => undefined)).toBe(false);
    expect(await readIndexedDb(offlinePassesKey('user-b'))).toBeNull();
    expect(await readOwnedOfflinePasses('user-a')).toEqual(copy('user-a'));
  });

  it('removes every copy, the owner, pending removals and the legacy key', async () => {
    await claimOfflinePasses('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    await writeIndexedDb(OFFLINE_PASSES_STORAGE_KEY, { legacy: true });
    await writeIndexedDb('other-key', 'keep');
    writeLocalStorage(pendingPassRemovalsKey('user-a'), '["reg-1"]');
    await clearOfflinePasses();
    expect(await readOfflinePassesOwner()).toBeNull();
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    expect(await readIndexedDb(OFFLINE_PASSES_STORAGE_KEY)).toBeNull();
    expect(readLocalStorage(pendingPassRemovalsKey('user-a'))).toBeNull();
    expect(await readIndexedDb('other-key')).toBe('keep');
  });

  it('still clears the copies when the owner cannot be read', async () => {
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    vi.mocked(readIndexedDb).mockRejectedValueOnce(new Error('blocked'));
    await clearOfflinePasses();
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
  });

  it("ends only the outgoing user's offline session in one step", async () => {
    await claimOfflinePasses('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    writeLocalStorage(pendingPassRemovalsKey('user-a'), '["reg-1"]');
    await endOfflinePassesSession('user-a');
    expect(await readOfflinePassesOwner()).toBeNull();
    expect(await readIndexedDb(offlinePassesKey('user-a'))).toBeNull();
    expect(readLocalStorage(pendingPassRemovalsKey('user-a'))).toBeNull();
  });

  it("does not touch the copy of another account that owns the device", async () => {
    await claimOfflinePasses('user-b');
    await writeIndexedDb(offlinePassesKey('user-b'), copy('user-b'));
    await endOfflinePassesSession('user-a');
    expect(await readOfflinePassesOwner()).toBe('user-b');
    expect(await readIndexedDb(offlinePassesKey('user-b'))).toEqual(copy('user-b'));
  });

  it('hides the copy from a read that starts after the session ended', async () => {
    await claimOfflinePasses('user-a');
    await writeIndexedDb(offlinePassesKey('user-a'), copy('user-a'));
    await endOfflinePassesSession('user-a');
    expect(await readOwnedOfflinePasses('user-a')).toBeNull();
  });
});
