"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from "../config/work-experience-feedback.config";
import { WORK_EXPERIENCES_QUERY_KEY } from "../constants/work-experience.constants";
import { workExperienceService } from "../services/work-experience.service";

export function useWorkExperiences() {
  const queryClient = useQueryClient();
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const queryKey = WORK_EXPERIENCES_QUERY_KEY;
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      signal.throwIfAborted();
      const items = await workExperienceService.getWorkExperiences();
      return items;
    },
  });
  async function reload() {
    if (!mountedRef.current) return;
    await queryClient.cancelQueries({ queryKey, exact: true });
    await query.refetch();
  }
  return { experiences: query.data ?? [], isLoading: query.isFetching,
    error: query.isError && !query.isFetching ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.loadError : null, reload };
}
