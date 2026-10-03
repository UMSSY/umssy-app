"use client";

import { useQuery } from "@tanstack/react-query";
import { getMentorProfile } from "../services/mentor-query.mock";

export function useMentorProfile(mentorId: string) {
  return useQuery({
    queryKey: ["mentorship", "profile", mentorId],
    queryFn: ({ signal }) => getMentorProfile(mentorId, signal),
  });
}

