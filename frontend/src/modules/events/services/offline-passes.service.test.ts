import '@/shared/testing/indexed-db.mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_PASSES_STORAGE_KEY } from '@/shared/constants/offline-passes.constants';
import { apiClient } from '@/shared/services/api-client';
import {
  clearAccessToken,
  saveAccessToken,
} from '@/shared/services/storage/access-token-storage';
import {
  readIndexedDb,
  readIndexedDbPair,
} from '@/shared/services/storage/browser-indexed-db';
import { listOfflinePasses } from './offline-passes.service';
import { registrationsService } from './registrations.service';

const accountA = `header.${btoa(JSON.stringify({ sub: 'titulado-a' }))}.test`;
const accountB = `header.${btoa(JSON.stringify({ sub: 'titulado-b' }))}.test`;
const pass = {
  id: 'registro-2257-a',
  qrToken: 'a'.repeat(64),
  status: { title: 'Confirmada' },
  event: {
    title: 'Taller de NestJS',
    eventDate: '2026-11-20',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Aula 101',
  },
};
const response = { data: { data: pass } };

describe('HU-08-14 offline pass copies', () => {
  const originalBaseUrl = apiClient.defaults.baseURL;

  beforeEach(() => {
    apiClient.defaults.baseURL = 'http://localhost/api';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiClient.defaults.baseURL = originalBaseUrl;
  });

  it('stores only confirmed detail data and restores it without an API call', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    await registrationsService.getPass(pass.id);
    get.mockRestore();

    vi.resetModules();
    const { initializeAccessTokenStorage } =
      await import('@/shared/services/storage/access-token-storage');
    const { listOfflinePasses: listAfterRestart } =
      await import('./offline-passes.service');
    await initializeAccessTokenStorage();
    await expect(listAfterRestart()).resolves.toEqual([
      {
        id: pass.id,
        qrToken: pass.qrToken,
        status: 'Confirmada',
        eventName: pass.event.title,
        date: pass.event.eventDate,
        startTime: pass.event.startTime,
        endTime: pass.event.endTime,
        location: pass.event.location,
        savedAt: expect.any(String),
      },
    ]);
  });

  it('returns an empty list with no saved pass, even after a cancelled detail response', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { ...pass, status: { title: 'Cancelada' } } },
    });
    await expect(registrationsService.getPass(pass.id)).rejects.toThrow();
    await expect(listOfflinePasses()).resolves.toEqual([]);
    get.mockRestore();
  });

  it("deletes the previous account's copy and ignores its late online response", async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(response);
    await registrationsService.getPass(pass.id);
    await expect(listOfflinePasses()).resolves.toHaveLength(1);

    let finishRequest!: (value: typeof response) => void;
    get.mockReturnValueOnce(
      new Promise((resolve) => {
        finishRequest = resolve;
      }),
    );
    const pending = registrationsService.getPass(pass.id);
    await saveAccessToken(accountB);
    finishRequest(response);
    await pending;

    await expect(listOfflinePasses()).resolves.toEqual([]);
    await expect(listOfflinePasses(accountA)).resolves.toEqual([]);
    await expect(readIndexedDb(OFFLINE_PASSES_STORAGE_KEY)).resolves.toBeNull();
    get.mockRestore();
  });

  it('invalidates a read from the old session and deletes its stored passes on logout', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    const pendingRead = listOfflinePasses();
    clearAccessToken();
    await expect(pendingRead).resolves.toEqual([]);
    await vi.waitFor(async () =>
      expect(await readIndexedDb(OFFLINE_PASSES_STORAGE_KEY)).toBeNull(),
    );
    await expect(listOfflinePasses()).resolves.toEqual([]);
    get.mockRestore();
  });

  it('guards against an outdated tab after the persisted session changes', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    const cache = await readIndexedDb(OFFLINE_PASSES_STORAGE_KEY);
    vi.mocked(readIndexedDbPair).mockResolvedValueOnce([accountB, cache]);
    await expect(listOfflinePasses()).resolves.toEqual([]);
    get.mockRestore();
  });
});
