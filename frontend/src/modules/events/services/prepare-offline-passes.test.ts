import '@/shared/testing/indexed-db.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { loadSessionOfflinePasses } from '../utils/offline-passes-store';
import { prepareOfflinePasses } from './prepare-offline-passes';
import { registrationsService } from './registrations.service';

vi.mock('./registrations.service', () => ({
  registrationsService: { getMine: vi.fn(), getPass: vi.fn() },
}));

const token = `h.${btoa(JSON.stringify({ sub: 'titulado-qa' }))}.s`;
const registration = {
  id: 'reg-1',
  eventName: 'Taller QA',
  date: '2026-11-28',
  startTime: '09:00',
  endTime: '12:00',
  location: 'Virtual',
  status: 'Confirmada',
};
const detail = { ...registration, location: null, qrToken: 'a'.repeat(64) };

beforeEach(async () => {
  vi.resetAllMocks();
  await saveAccessToken(token);
});

describe('preparing passes from the authenticated shell', () => {
  it('stores confirmed QR details without visiting the passes screen', async () => {
    vi.mocked(registrationsService.getMine).mockResolvedValue([registration]);
    vi.mocked(registrationsService.getPass).mockResolvedValue(detail);
    const { signal } = new AbortController();
    await prepareOfflinePasses(token, signal);
    expect(registrationsService.getPass).toHaveBeenCalledWith(
      'reg-1',
      signal,
      token,
      false,
    );
    expect((await loadSessionOfflinePasses(token))?.passes).toEqual([
      { ...detail, location: 'Virtual' },
    ]);
  });

  it('treats a confirmed empty list as ready', async () => {
    vi.mocked(registrationsService.getMine).mockResolvedValue([]);
    await expect(
      prepareOfflinePasses(token, new AbortController().signal),
    ).resolves.toMatchObject({ passes: [] });
    expect(registrationsService.getPass).not.toHaveBeenCalled();
  });

  it('keeps the previous copy when a detail fails', async () => {
    vi.mocked(registrationsService.getMine).mockResolvedValue([registration]);
    vi.mocked(registrationsService.getPass)
      .mockResolvedValueOnce(detail)
      .mockRejectedValueOnce(new Error('Sin conexión'));
    const { signal } = new AbortController();
    const previous = await prepareOfflinePasses(token, signal);
    await expect(prepareOfflinePasses(token, signal)).rejects.toThrow(
      'Sin conexión',
    );
    expect((await loadSessionOfflinePasses(token))?.passes).toEqual(
      previous?.passes,
    );
  });

  it('removes revoked passes even if downloading another QR fails', async () => {
    vi.mocked(registrationsService.getMine).mockResolvedValue([
      registration,
      { ...registration, id: 'reg-2' },
    ]);
    vi.mocked(registrationsService.getPass).mockImplementation(async (id) => ({
      ...detail,
      id,
    }));
    const { signal } = new AbortController();
    await prepareOfflinePasses(token, signal);
    vi.mocked(registrationsService.getMine).mockResolvedValue([registration]);
    vi.mocked(registrationsService.getPass).mockRejectedValue(
      new Error('Network failed'),
    );
    await expect(prepareOfflinePasses(token, signal)).rejects.toThrow(
      'Network failed',
    );
    expect(
      (await loadSessionOfflinePasses(token))?.passes.map((pass) => pass.id),
    ).toEqual(['reg-1']);
  });
});
