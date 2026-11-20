'use client';

import { useQuery } from '@tanstack/react-query';
import { MENTORSHIP_QUERY_KEYS } from '../constants/mentorship-query-keys.constants';
import { getSimilarMentors } from '../services/similar-mentors.service';

export function useSimilarMentors(mentorId: string, enabled = true) {
  return useQuery({
    queryKey: MENTORSHIP_QUERY_KEYS.similar(mentorId),
    queryFn: ({ signal }) => getSimilarMentors(mentorId, signal),
    enabled: enabled && Boolean(mentorId),
  });
}
