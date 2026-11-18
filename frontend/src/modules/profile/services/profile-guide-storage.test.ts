import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createProfileGuideSession,
  profileGuideStorage,
} from './profile-guide-storage';

const database = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));

vi.mock('@/shared/services/storage/indexed-db-storage', () => ({
  createIndexedDbStorage: vi.fn(() => database),
}));

beforeEach(() => {
  database.read.mockReset();
  database.write.mockReset();
});

describe('profileGuideStorage', () => {
  it('stores guide preferences separately for each signed-in account', async () => {
    const sessions = new Map();
    database.write.mockImplementation(async (key, value) => {
      sessions.set(key, value);
    });
    database.read.mockImplementation(async (key) => sessions.get(key));
    const first = {
      ...createProfileGuideSession(),
      dismissed: true,
      lastStep: 'education' as const,
    };
    const second = { ...createProfileGuideSession(), completed: true };

    await profileGuideStorage.write('account-a', first);
    await profileGuideStorage.write('account-b', second);

    expect(await profileGuideStorage.read('account-a')).toEqual(first);
    expect(await profileGuideStorage.read('account-b')).toEqual(second);
    expect(await profileGuideStorage.read('account-c')).toEqual(
      createProfileGuideSession(),
    );
    expect(database.write).toHaveBeenCalledWith('account-a', first);
    expect(database.write).toHaveBeenCalledWith('account-b', second);
  });

  it.each([
    undefined,
    null,
    'invalid',
    23,
    [],
    {},
    { version: 2 },
    { version: '1' },
  ])(
    'returns a fresh session for absent, malformed or incompatible stored data (%j)',
    async (value) => {
      database.read.mockResolvedValue(value);
      expect(await profileGuideStorage.read('account')).toEqual(
        createProfileGuideSession(),
      );
    },
  );

  it('sanitizes stored flags and limits resumed and skipped sections to supported IDs', async () => {
    database.read.mockResolvedValue({
      version: 1,
      dismissed: 'true',
      completed: 1,
      lastStep: 'removed-section',
      skipped: ['skills', 'unknown', 'education', 'skills', 12, null],
    });

    expect(await profileGuideStorage.read('account')).toEqual({
      version: 1,
      dismissed: false,
      completed: false,
      lastStep: null,
      skipped: ['education', 'skills'],
    });

    database.read.mockResolvedValue({
      version: 1,
      dismissed: true,
      completed: true,
      lastStep: 'cv',
      skipped: 'education',
    });
    expect(await profileGuideStorage.read('account')).toEqual({
      version: 1,
      dismissed: true,
      completed: true,
      lastStep: 'cv',
      skipped: [],
    });
  });

  it('keeps new session arrays independent', () => {
    const first = createProfileGuideSession();
    first.skipped.push('education');
    expect(createProfileGuideSession().skipped).toEqual([]);
  });

  it('exposes unavailable storage and failed writes for the provider to handle', async () => {
    const failure = new Error('IndexedDB unavailable');
    database.read.mockRejectedValue(failure);
    database.write.mockRejectedValue(failure);
    await expect(profileGuideStorage.read('account')).rejects.toBe(failure);
    await expect(
      profileGuideStorage.write('account', createProfileGuideSession()),
    ).rejects.toBe(failure);
  });

  it('waits until the account preference write has committed', async () => {
    let commit!: () => void;
    database.write.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          commit = resolve;
        }),
    );
    const finished = vi.fn();
    const writing = profileGuideStorage
      .write('account', createProfileGuideSession())
      .then(finished);
    await Promise.resolve();
    expect(finished).not.toHaveBeenCalled();
    commit();
    await writing;
    expect(finished).toHaveBeenCalledOnce();
  });
});
