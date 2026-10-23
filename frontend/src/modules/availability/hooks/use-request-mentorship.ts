"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getWeekRange, addWeeks } from "@/shared/utils/date-time";
import { REQUEST_MENTORSHIP_TEXT } from "../constants/request-mentorship.constants";
import { availabilityApi } from "../services/availability.api";

export function useRequestMentorship(mentorId: string) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const lastRequestRef = useRef(0);

  const requestMentorship = async () => {
    const requestId = ++lastRequestRef.current;
    setIsChecking(true);

    try {
      const currentWeek = getWeekRange(new Date());
      const nextWeek = getWeekRange(addWeeks(currentWeek.startAt, 1));
      const [currentWeekBlocks, nextWeekBlocks] = await Promise.all([
        availabilityApi.getMentorFreeBlocks(mentorId, currentWeek),
        availabilityApi.getMentorFreeBlocks(mentorId, nextWeek),
      ]);
      if (requestId !== lastRequestRef.current) return;

      if (currentWeekBlocks.length + nextWeekBlocks.length === 0) {
        toast.error(REQUEST_MENTORSHIP_TEXT.noSlots);
        return;
      }

      router.push(`/mentors/${mentorId}/availability`);
    } catch {
      if (requestId === lastRequestRef.current) toast.error(REQUEST_MENTORSHIP_TEXT.checkError);
    } finally {
      if (requestId === lastRequestRef.current) setIsChecking(false);
    }
  };

  return { requestMentorship, isChecking };
}
