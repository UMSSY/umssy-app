import { getAccessToken } from "@/shared/services/storage/access-token-storage";
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { registrationsService } from './registrations.service';

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()),
  apiClient: { defaults: { baseURL: 'http://localhost/api' }, get: vi.fn() },
}));

vi.mock('@/shared/services/storage/access-token-storage', () => ({ getAccessToken: vi.fn() }));

describe('registrationsService' , () => {
  beforeEach(() => {
    apiClient.defaults.baseURL = 'http://localhost/api';
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue(null);
  });
  it('envía el token de sesión y devuelve las inscripciones del backend', async () => {
    vi.mocked(getAccessToken).mockReturnValue('signed-token');
    const items = [
      {
        id: 'registration-1',
        eventName: 'React',
        date: '2026-10-20',
        startTime: '09:00',
        endTime: '12:00',
        location: 'Aula 101',
        status: 'Confirmada',
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: items } });
    const signal = new AbortController().signal;
    await expect(registrationsService.getMine(signal)).resolves.toEqual(items);
    expect(apiClient.get).toHaveBeenCalledWith('/event-registrations/me', {
      headers: { Authorization: 'Bearer signed-token' },
      signal,
      timeout: 10000,
    });
  });
  it('rechaza la URL ausente sin enviar la solicitud', async () => {
    vi.mocked(getAccessToken).mockReturnValue('token');
    apiClient.defaults.baseURL = undefined;
    await expect(registrationsService.getMine()).rejects.toThrow(
      'URL del backend',
    );
    expect(apiClient.get).not.toHaveBeenCalled();
  });
  it('no consulta sin sesión', async () => {
    await expect(registrationsService.getMine()).rejects.toThrow(
      'Debes iniciar sesión',
    );
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});


describe('Private pass API contract', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAccessToken).mockReturnValue('token'); apiClient.defaults.baseURL = 'http://localhost/api'; });
  const data = { id: 'pass-1', qrToken: 'a'.repeat(64), status: { title: 'Confirmada' }, event: { title: 'React', eventDate: '2026-11-20', startTime: '09:00', endTime: '12:00', location: null } };
  it('parses the nested event and status returned by the private endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data } });
    await expect(registrationsService.getPass('pass-1')).resolves.toMatchObject({ id: 'pass-1', qrToken: data.qrToken, eventName: 'React', date: '2026-11-20', status: 'Confirmada', location: null });
  });
  it.each([{ ...data, qrToken: null }, { ...data, qrToken: '' }, { ...data, qrToken: 'invalid' }, { ...data, id: 'another-pass' }, { ...data, status: { title: 'Cancelada' } }, { ...data, event: null }])('rejects an invalid private pass: %j', async (invalid) => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: invalid } });
    await expect(registrationsService.getPass('pass-1')).rejects.toThrow();
  });
  it('does not request the pass without a session or backend URL', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    await expect(registrationsService.getPass('pass-1')).rejects.toThrow('sesión');
    vi.mocked(getAccessToken).mockReturnValue('token'); apiClient.defaults.baseURL = undefined;
    await expect(registrationsService.getPass('pass-1')).rejects.toThrow('URL');
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
