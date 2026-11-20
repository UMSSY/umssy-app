"use client";

import { useQuery } from "@tanstack/react-query";
import { getMentorDirectory } from "../services/mentor-directory.service";
import { type MentorDirectoryParams } from "../types/mentor-directory-params.types";

export function useMentorDirectory(params: MentorDirectoryParams) {
  return useQuery({
    queryKey: ["mentorship", "directory", params],
    queryFn: ({ signal }) => getMentorDirectory(params, signal),
  });
}
