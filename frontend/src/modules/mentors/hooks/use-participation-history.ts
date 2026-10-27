"use client";
import { useQuery } from "@tanstack/react-query";
import { mentorParticipationService } from "../services/mentor-participation.service";

export function useParticipationHistory(userId: string, isOpen: boolean) {
  return useQuery({ queryKey: ["mentor-participation-history", userId], queryFn: () => mentorParticipationService.getHistory(), enabled: isOpen, retry: false });
}
