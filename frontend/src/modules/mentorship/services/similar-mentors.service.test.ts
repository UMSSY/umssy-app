import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { SIMILAR_MENTORS_FIXTURE } from '../testing/similar-mentors.fixture';
import { getSimilarMentors } from './similar-mentors.service';

afterEach(() => vi.restoreAllMocks());

describe('getSimilarMentors', () => {
  it('consulta el endpoint con señal, extrae data y conserva el orden y las fotos', async () => {
    const mentors = [...SIMILAR_MENTORS_FIXTURE]
      .reverse()
      .map((mentor, index) => ({
        ...mentor,
        photoUrl: index === 0 ? '/files/photo' : null,
      }));
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: { data: mentors } });
    const signal = new AbortController().signal;
    const result = await getSimilarMentors('mentor-id', signal);
    expect(get).toHaveBeenCalledExactlyOnceWith('/mentors/mentor-id/similar', {
      signal,
    });
    expect(result.map(({ id }) => id)).toEqual(mentors.map(({ id }) => id));
    expect(result[0].photoUrl).toBe(apiClient.getUri({ url: '/files/photo' }));
    expect(result[1].photoUrl).toBeNull();
    expect(result[0].technicalAreas).toEqual(mentors[0].technicalAreas);
  });
  it('acepta un arreglo vacío', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: [] } });
    await expect(getSimilarMentors('mentor-id')).resolves.toEqual([]);
  });
  it.each([
    new Error('network'),
    { response: { status: 404 } },
    { response: { status: 500 } },
  ])('propaga el error sin convertirlo en vacío: %s', async (error) => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(error);
    await expect(getSimilarMentors('mentor-id')).rejects.toBe(error);
  });
});
