
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMentorDirectory,
  type MentorDirectoryParams,
} from "../services/mentor-directory.service";

export function useMentorDirectory(params: MentorDirectoryParams) {
  return useQuery({
    queryKey: ["mentorship", "directory", params],
    queryFn: ({ signal }) => getMentorDirectory(params, signal),
  });
}
