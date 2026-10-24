"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/shared/components/layout";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addWeeks, getWeekRange } from "@/shared/utils/date-time";
import { cn } from "cn";
import { AvailabilityLoading } from "../components/availability-loading";
import { BlockSelection } from "../components/block-selection/block-selection";
import { MENTOR_FREE_BLOCKS_TEXT } from "../constants/mentor-free-blocks.constants";
import { useMentorFreeBlocks } from "../hooks/use-mentor-free-blocks";
import { availabilityApi } from "../services/availability.api";
import type { MentorFreeBlocksViewProps } from "../types/mentor-free-blocks-view-props.types";
import { formatWeekLabel } from "../utils/format-week-label";

export function MentorFreeBlocksView({ mentorId }: MentorFreeBlocksViewProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekRange(new Date()).startAt);
  const weekRange = getWeekRange(weekStart);
  const currentWeekStart = getWeekRange(new Date()).startAt;
  const { blocks, isLoading, error } = useMentorFreeBlocks(mentorId, weekRange);

  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Link href={`/mentors/${mentorId}`} className="inline-flex items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"><ChevronLeft className="size-4" aria-hidden="true" />Volver al perfil del mentor</Link>
      <PageHeading title={MENTOR_FREE_BLOCKS_TEXT.heading} description="Revisa los horarios disponibles y selecciona un bloque." />

      <nav
        aria-label={MENTOR_FREE_BLOCKS_TEXT.weekNavigation}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-soft p-3"
      >
        <Button
          variant="outline"
          size="icon"
          aria-label={MENTOR_FREE_BLOCKS_TEXT.previousWeek}
          onClick={() => setWeekStart(addWeeks(weekStart, -1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="min-w-44 text-center text-sm font-medium" aria-live="polite">
          {formatWeekLabel(weekRange)}
        </p>
        <Button
          variant="outline"
          size="icon"
          aria-label={MENTOR_FREE_BLOCKS_TEXT.nextWeek}
          onClick={goToNextWeek}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          disabled={weekStart === currentWeekStart}
          onClick={() => setWeekStart(currentWeekStart)}
        >
          {MENTOR_FREE_BLOCKS_TEXT.today}
        </Button>
      </nav>

      {isLoading ? (
        <AvailabilityLoading />
      ) : error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : blocks.length === 0 ? (
        <section
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg",
            "border border-dashed border-border p-8 text-center",
          )}
        >
          <p className="text-muted-foreground">{MENTOR_FREE_BLOCKS_TEXT.empty}</p>
          <Button type="button" variant="outline" onClick={goToNextWeek}>
            {MENTOR_FREE_BLOCKS_TEXT.nextWeekFromEmpty}
          </Button>
        </section>
      ) : (
        <BlockSelection
          blocks={blocks}
          weekRange={weekRange}
          fetchFreeBlocks={() => availabilityApi.getMentorFreeBlocks(mentorId, weekRange)}
        />
      )}
    </div>
  );
}
