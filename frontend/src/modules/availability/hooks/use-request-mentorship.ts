"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WeekRange } from "@/shared/types/week-range.types";
import { getWeekRange, addWeeks } from "@/shared/utils/date-time";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { FREE_BLOCKS_STALE_TIME_MS } from "../constants/mentor-free-blocks.constants";
import { REQUEST_MENTORSHIP_TEXT } from "../constants/request-mentorship.constants";
import { availabilityApi } from "../services/availability.service";

export function useRequestMentorship(mentorId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const [hasNoSlots, setHasNoSlots] = useState(false);
  const lastRequestRef = useRef(0);

  const fetchWeekBlocks = (weekRange: WeekRange) =>
    queryClient.fetchQuery({
      queryKey: AVAILABILITY_QUERY_KEYS.freeBlocks(mentorId, weekRange.startAt),
      queryFn: () => availabilityApi.getMentorFreeBlocks(mentorId, weekRange),
      staleTime: FREE_BLOCKS_STALE_TIME_MS,
    });

  const requestMentorship = async () => {
    const requestId = ++lastRequestRef.current;
    setIsChecking(true);
    setHasNoSlots(false);

    try {
      const currentWeek = getWeekRange(new Date());
      const nextWeek = getWeekRange(addWeeks(currentWeek.startAt, 1));
      const [currentWeekBlocks, nextWeekBlocks] = await Promise.all([
        fetchWeekBlocks(currentWeek),
        fetchWeekBlocks(nextWeek),
      ]);
      if (requestId !== lastRequestRef.current) return;

      if (currentWeekBlocks.length + nextWeekBlocks.length === 0) {
        setHasNoSlots(true);
        return;
      }

      router.push(`/mentors/${mentorId}/availability`);
    } catch {
      if (requestId === lastRequestRef.current) toast.error(REQUEST_MENTORSHIP_TEXT.checkError);
    } finally {
      if (requestId === lastRequestRef.current) setIsChecking(false);
    }
  };

  return { requestMentorship, isChecking, hasNoSlots };
}
