"use client";

import { PageHeading } from "@/shared/components/layout";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addWeeks, getWeekRange } from "@/shared/utils/date-time";
import { cn } from "cn";
import {
  MY_AVAILABILITY_EYEBROW,
  MY_AVAILABILITY_TEXT,
} from "../constants/my-availability.constants";
import { AvailabilityLoading } from "../components/availability-loading";
import { AvailabilityBlockEditor } from "../components/availability-block-editor";
import { WeekGrid } from "../components/week-grid/week-grid";
import { useMyBlocks } from "../hooks/use-my-blocks";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { MentorAvailabilityViewProps } from "../types/mentor-availability-view-props.types";
import { formatWeekLabel } from "../utils/format-week-label";

export function MentorAvailabilityView({ initialWeekStart }: MentorAvailabilityViewProps) {
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart ?? getWeekRange(new Date()).startAt,
  );
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const { blocks, isLoading, error } = useMyBlocks(weekStart);
  const [isCreating, setIsCreating] = useState(false);
  const weekRange = getWeekRange(weekStart);
  const currentWeekStart = getWeekRange(new Date()).startAt;

  const handleWeekChange = (nextWeekStart: string) => {
    setEditBlockId(null);
    setWeekStart(nextWeekStart);
  };

  const handleEditBlock = (block: AvailabilityBlock) => {
    setEditBlockId(block.id);
  };

  const handleClosePanel = () => {
    setEditBlockId(null);
  };

  const editBlock = editBlockId
    ? blocks.find((item) => item.id === editBlockId) ?? null
    : null;
  const isEditing = Boolean(editBlock) && !error;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <PageHeading title={MY_AVAILABILITY_TEXT.title} description={`${MY_AVAILABILITY_EYEBROW}. Selecciona un bloque para editarlo o registra uno nuevo.`} actions={<Button onClick={() => setIsCreating(true)} disabled={isLoading || Boolean(error)}><Plus aria-hidden="true" />Añadir bloque</Button>} />
      </header>

      <div>
        <div className="min-w-0 space-y-4">
          <nav
            aria-label={MY_AVAILABILITY_TEXT.weekNavigation}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-3"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label={MY_AVAILABILITY_TEXT.previousWeek}
              onClick={() => handleWeekChange(addWeeks(weekStart, -1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="min-w-44 text-center text-sm font-medium" aria-live="polite">
              {formatWeekLabel(weekRange)}
            </p>
            <Button
              variant="outline"
              size="icon"
              aria-label={MY_AVAILABILITY_TEXT.nextWeek}
              onClick={() => handleWeekChange(addWeeks(weekStart, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              disabled={weekStart === currentWeekStart}
              onClick={() => handleWeekChange(currentWeekStart)}
            >
              {MY_AVAILABILITY_TEXT.today}
            </Button>
          </nav>

          {isLoading ? (
            <AvailabilityLoading />
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : (
            <>
              {blocks.length === 0 && (
                <p
                  role="status"
                  className={cn(
                    "rounded-lg border border-dashed border-border px-4 py-3",
                    "text-center text-sm text-muted-foreground",
                  )}
                >
                  {MY_AVAILABILITY_TEXT.emptyWeek}
                </p>
              )}
              <WeekGrid
                blocks={blocks}
                weekRange={weekRange}
                variant="owner"
                onEditBlock={handleEditBlock}
              />
            </>
          )}
        </div>

        {isCreating || isEditing ? <AvailabilityBlockEditor key={editBlockId ?? "create"} block={isEditing ? editBlock : undefined} onClose={() => { setIsCreating(false); handleClosePanel(); }} onCreated={(block) => setWeekStart(getWeekRange(block.startAt).startAt)} /> : null}
      </div>
    </main>
  );
}
