"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mentorParticipationService } from "../services/mentor-participation.service";

export function useCancelParticipationRequest(onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => mentorParticipationService.cancel(),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }),
        client.invalidateQueries({ queryKey: ["mentor-participation-history"] }),
      ]);
      onSuccess();
    },
  });
}
