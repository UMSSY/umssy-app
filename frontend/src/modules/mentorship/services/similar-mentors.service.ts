import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type { MentorDirectoryItem } from '../types/mentor-directory.types';
import { resolveMentorPhotoUrl } from '../utils/resolve-mentor-photo-url';

export async function getSimilarMentors(
  mentorId: string,
  signal?: AbortSignal,
): Promise<MentorDirectoryItem[]> {
  const response = await apiClient.get<ApiResponse<MentorDirectoryItem[]>>(
    `/mentors/${mentorId}/similar`,
    { signal },
  );
  return response.data.data.map((mentor) => ({
    ...mentor,
    photoUrl: resolveMentorPhotoUrl(mentor.photoUrl),
  }));
}
