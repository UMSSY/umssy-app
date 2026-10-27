import { getAccessToken } from "@/shared/services/storage/access-token-storage";
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { registrationsService } from './registrations.service';

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()),
  apiClient: { defaults: { baseURL: 'http://localhost/api' }, get: vi.fn(), post: vi.fn() },
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

describe('Proposal support API contract', () => {
  const support = {
    eventId: 'proposal-1',
    status: 'voting',
    supportCount: 15,
    supportThreshold: 20,
    supportsRemaining: 5,
    progressPercent: 75,
    hasSupported: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue('signed-token');
    apiClient.defaults.baseURL = 'http://localhost/api';
  });

  it('sends a bodyless POST with the session token and returns voting progress', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { statusCode: 201, ok: true, detail: 'Operación exitosa', data: support },
    });

    await expect(registrationsService.supportProposal('proposal-1')).resolves.toEqual(support);
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
      '/event-registrations/support/proposal-1',
      undefined,
      {
        headers: { Authorization: 'Bearer signed-token' },
        timeout: 10_000,
      },
    );
  });

  it('accepts publication when the support completes the threshold', async () => {
    const published = {
      ...support,
      status: 'Publicado',
      supportCount: 20,
      supportsRemaining: 0,
      progressPercent: 100,
    };
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { statusCode: 201, ok: true, data: published },
    });

    await expect(registrationsService.supportProposal('proposal-1', 'other-token'))
      .resolves.toEqual(published);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/event-registrations/support/proposal-1',
      undefined,
      expect.objectContaining({ headers: { Authorization: 'Bearer other-token' } }),
    );
  });

  it('does not send a request without a configured backend URL', async () => {
    apiClient.defaults.baseURL = undefined;

    await expect(registrationsService.supportProposal('proposal-1')).rejects.toThrow(
      'La URL del backend no está configurada.',
    );
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('preserves the backend error for code-based handling by the action hook', async () => {
    const error = { isAxiosError: true, response: { status: 409 } };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    await expect(registrationsService.supportProposal('proposal-1')).rejects.toBe(error);
  });
});
