import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { managedWorkshopsService } from './managed-workshops.service';

vi.mock('@/shared/services/api-client', () => ({
  apiClient: { defaults: { baseURL: 'http://localhost/api' }, get: vi.fn() },
}));
vi.mock('@/shared/services/storage/access-token-storage', () => ({ getAccessToken: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAccessToken).mockReturnValue('session-token');
  apiClient.defaults.baseURL = 'http://localhost/api';
});

describe('managedWorkshopsService', () => {
  it('reads only the authenticated managed list, preserving its optional fields', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [
      { id: 'event-1', title: 'Taller', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: null },
    ] } });
    await expect(managedWorkshopsService.getMine(signal)).resolves.toEqual([
      { id: 'event-1', title: 'Taller', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: null, coverUrl: null },
    ]);
    expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/events/managed', expect.objectContaining({
      headers: { Authorization: 'Bearer session-token' }, signal,
    }));
  });

  it('fails closed without a session or with an invalid response', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    await expect(managedWorkshopsService.getMine()).rejects.toThrow('iniciar sesión');
    expect(apiClient.get).not.toHaveBeenCalled();
    vi.mocked(getAccessToken).mockReturnValue('session-token');
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ id: 'event-1' }] } });
    await expect(managedWorkshopsService.getMine()).rejects.toThrow('respuesta');
  });
});
