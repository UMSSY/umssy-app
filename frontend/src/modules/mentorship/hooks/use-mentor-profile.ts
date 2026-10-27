"use client";

import { useQuery } from "@tanstack/react-query";
import { MENTORSHIP_QUERY_KEYS } from "../constants/mentorship-query-keys.constants";
import { getMentorProfile } from "../services/mentor-profile.service";

export function useMentorProfile(mentorId: string) {
  return useQuery({
    queryKey: MENTORSHIP_QUERY_KEYS.profile(mentorId),
    queryFn: ({ signal }) => getMentorProfile(mentorId, signal),
  });
}
