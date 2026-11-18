import '@/shared/testing/indexed-db.mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { apiClient } from '@/shared/services/api-client';
import {
  clearAccessToken,
  saveAccessToken,
} from '@/shared/services/storage/access-token-storage';
import {
  readIndexedDb,
  readIndexedDbPair,
} from '@/shared/services/storage/browser-indexed-db';
import { loadSessionOfflinePasses } from '../utils/offline-passes-store';
import { registrationsService } from './registrations.service';
import { registrationsService as registrationApi } from '@/modules/event-registrations';
import { reconcileOfflinePasses } from './offline-passes.service';

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
    const { loadSessionOfflinePasses: readAfterRestart } =
      await import('../utils/offline-passes-store');
    await initializeAccessTokenStorage();
    const restored = await readAfterRestart(accountA);
    expect(restored?.savedAt).toEqual(expect.any(String));
    expect(restored?.passes).toEqual([
      {
        id: pass.id,
        qrToken: pass.qrToken,
        status: 'Confirmada',
        eventName: pass.event.title,
        date: pass.event.eventDate,
        startTime: pass.event.startTime,
        endTime: pass.event.endTime,
        location: pass.event.location,
      },
    ]);
  });

  it('removes a saved QR when cancellation succeeds through the shared registration service', async () => {
    await saveAccessToken(accountA);
    vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: { statusCode: 200, ok: true, detail: 'Operación exitosa', data: {
      id: pass.id, eventId: 'event-1', status: 'cancelled', qrToken: pass.qrToken,
      registeredAt: '2026-11-10T14:00:00.000Z', cancelledAt: '2026-11-17T14:00:00.000Z',
    } } });

    await registrationApi.cancel(pass.id, accountA);
    expect((await loadSessionOfflinePasses(accountA))?.passes).toEqual([]);
  });

  it('returns an empty list with no saved pass, even after a cancelled detail response', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { ...pass, status: { title: 'Cancelada' } } },
    });
    await expect(registrationsService.getPass(pass.id)).rejects.toThrow();
    await expect(loadSessionOfflinePasses(accountA)).resolves.toBeNull();
    get.mockRestore();
  });

  it("deletes the previous account's copy and ignores its late online response", async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(response);
    await registrationsService.getPass(pass.id);
    expect((await loadSessionOfflinePasses(accountA))?.passes).toHaveLength(1);

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

    await expect(loadSessionOfflinePasses(accountA)).resolves.toBeNull();
    await expect(loadSessionOfflinePasses(accountB)).resolves.toBeNull();
    await expect(
      readIndexedDb(offlinePassesKey('titulado-a')),
    ).resolves.toBeNull();
    get.mockRestore();
  });

  it('invalidates a read from the old session and deletes its stored passes on logout', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    const pendingRead = loadSessionOfflinePasses(accountA);
    clearAccessToken();
    await expect(pendingRead).resolves.toBeNull();
    await vi.waitFor(async () =>
      expect(await readIndexedDb(offlinePassesKey('titulado-a'))).toBeNull(),
    );
    await expect(loadSessionOfflinePasses(accountA)).resolves.toBeNull();
    get.mockRestore();
  });

  it('guards against an outdated tab after the persisted session changes', async () => {
    await saveAccessToken(accountA);
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response);
    await registrationsService.getPass(pass.id);
    const cache = await readIndexedDb(offlinePassesKey('titulado-a'));
    vi.mocked(readIndexedDbPair).mockResolvedValueOnce([accountB, cache]);
    await expect(loadSessionOfflinePasses(accountA)).resolves.toBeNull();
    get.mockRestore();
  });

  it('removes missing passes after a successful refresh and updates the remaining workshop details', async () => {
    await saveAccessToken(accountA);
    vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ data: { data: { ...pass, id: 'keep-me' } } });
    await registrationsService.getPass(pass.id);
    const remaining = await registrationsService.getPass('keep-me');
    const signal = new AbortController().signal;
    await expect(
      reconcileOfflinePasses(
        [{ ...remaining, location: 'Virtual' }],
        accountA,
        signal,
      ),
    ).resolves.toBe(true);
    expect((await loadSessionOfflinePasses(accountA))?.passes).toEqual([
      { ...remaining, location: 'Virtual' },
    ]);
  });
});
