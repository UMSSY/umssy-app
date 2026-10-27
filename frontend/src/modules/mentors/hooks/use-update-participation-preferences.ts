"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mentorParticipationService } from "../services/mentor-participation.service";
import type { MentorParticipationPreferencesPayload } from "../types/mentor-participation-preferences-payload.types";

export function useUpdateParticipationPreferences(preferences: MentorParticipationPreferencesPayload, onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => mentorParticipationService.update(preferences),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }),
        client.invalidateQueries({ queryKey: ["mentor-participation-history"] }),
      ]);
      onSuccess();
    },
  });
}
