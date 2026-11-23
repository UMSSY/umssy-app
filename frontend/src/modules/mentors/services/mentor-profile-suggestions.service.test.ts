import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { mentorProfileSuggestionsService } from './mentor-profile-suggestions.service';

const photo = {
  code: 'MISSING_PROFILE_PHOTO',
  field: 'photoUrl',
  title: 'Foto',
  message: 'Agrega una foto',
  benefitDescription: 'Reconocimiento',
  editReference: { section: 'photoUrl', action: 'edit' },
};
afterEach(() => vi.restoreAllMocks());

describe('contrato de recomendaciones HU-13', () => {
  it('consulta mediante el cliente autenticado y transmite AbortSignal', async () => {
    const data = { suggestions: [photo], pendingCount: 1 };
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: { ok: true, data } });
    const signal = new AbortController().signal;
    await expect(
      mentorProfileSuggestionsService.getMySuggestions(signal),
    ).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith('/mentors/me/profile-suggestions', {
      signal,
    });
  });
  it('acepta perfil completo', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ok: true, data: { suggestions: [], pendingCount: 0 } },
    });
    await expect(
      mentorProfileSuggestionsService.getMySuggestions(),
    ).resolves.toEqual({ suggestions: [], pendingCount: 0 });
  });
  it.each([
    { suggestions: [photo], pendingCount: 0 },
    { suggestions: [photo, photo], pendingCount: 2 },
    { suggestions: [{ ...photo, code: 'UNKNOWN' }], pendingCount: 1 },
    {
      suggestions: [
        { ...photo, editReference: { section: 'aboutMe', action: 'edit' } },
      ],
      pendingCount: 1,
    },
    { suggestions: null, pendingCount: 0 },
    null,
  ])(
    'rechaza contratos inconsistentes sin inventar pendientes: %j',
    async (data) => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: { ok: true, data },
      });
      await expect(
        mentorProfileSuggestionsService.getMySuggestions(),
      ).rejects.toThrow();
    },
  );
  it.each([401, 403, 404, 500])('propaga HTTP %s', async (status) => {
    const error = new Error(`HTTP ${status}`);
    vi.spyOn(apiClient, 'get').mockRejectedValue(error);
    await expect(
      mentorProfileSuggestionsService.getMySuggestions(),
    ).rejects.toBe(error);
  });
});
