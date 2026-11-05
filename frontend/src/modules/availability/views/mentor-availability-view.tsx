"use client";

import { PageHeading } from "@/shared/components/layout";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOLIVIA_TIME_LABEL } from "@/shared/constants/date-time.constants";
import { addWeeks, getWeekRange } from "@/shared/utils/date-time";
import { cn } from "cn";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import {
  MY_AVAILABILITY_EYEBROW,
  MY_AVAILABILITY_TEXT,
} from "../constants/my-availability.constants";
import { AvailabilityLoading } from "../components/availability-loading";
import { BlockForm } from "../components/block-form";
import { BlockedDatePanel } from "../components/blocked-date-panel";
import { BlockedDatesList } from "../components/blocked-dates-list";
import { EditBlockPanel } from "../components/edit-block-panel";
import { ReceiveRequestsSwitch } from "../components/receive-requests-switch";
import { WeekGrid } from "../components/week-grid/week-grid";
import { useCreateAvailabilityBlock } from "../hooks/use-create-availability-block";
import { useElementHeight } from "../hooks/use-element-height";
import { useBlockedDates } from "../hooks/use-blocked-dates";
import { useMyBlocks } from "../hooks/use-my-blocks";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import type { MentorAvailabilityViewProps } from "../types/mentor-availability-view-props.types";
import { formatWeekLabel } from "../utils/format-week-label";
import { isWeeklyRepeatResponse } from "../utils/is-weekly-repeat-response";

export function MentorAvailabilityView({
  initialWeekStart,
}: MentorAvailabilityViewProps) {
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart ?? getWeekRange(new Date()).startAt,
  );
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const { ref: weekNavRef, height: weekNavHeight } = useElementHeight<HTMLElement>();

  const {
    blocks,
    isLoading: blocksLoading,
    error: blocksError,
  } = useMyBlocks(weekStart);
  const {
    blockedDates,
    isLoading: datesLoading,
    error: datesError,
  } = useBlockedDates(weekStart);
  const { createBlock, isSubmitting } = useCreateAvailabilityBlock();

  const isLoading = blocksLoading || datesLoading;
  const error = blocksError ?? datesError;
  const weekRange = getWeekRange(weekStart);
  const currentWeekStart = getWeekRange(new Date()).startAt;

  const handleWeekChange = (nextWeekStart: string) => {
    setEditBlockId(null);
    setSelectedDate(null);
    setWeekStart(nextWeekStart);
  };

  const handleEditBlock = (block: AvailabilityBlock) => {
    setSelectedDate(null);
    setEditBlockId(block.id);
  };

  const handleSelectDate = (date: string) => {
    setEditBlockId(null);
    setSelectedDate(date);
  };

  const handleClosePanel = () => {
    setEditBlockId(null);
  };

  const handleCreate = async (values: CreateAvailabilityBlockInput) => {
    const result = await createBlock(values);
    if (!result) return;
    if (isWeeklyRepeatResponse(result) && result.created === 0) return;
    setFormKey((key) => key + 1);
    setWeekStart(getWeekRange(values.startAt).startAt);
  };

  const handleCancelCreate = () => {
    setFormKey((key) => key + 1);
  };

  const editBlock = editBlockId
    ? blocks.find((item) => item.id === editBlockId) ?? null
    : null;
  const isEditing = Boolean(editBlockId) && !error;
  const showBlockedPanel = selectedDate !== null && !isLoading && !error;
  const showEditPanel = !showBlockedPanel && isEditing;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <PageHeading
          title={MY_AVAILABILITY_TEXT.title}
          description={`${MY_AVAILABILITY_EYEBROW}. ${BLOCKED_DATE_TEXT.viewHint}`}
          actions={<ReceiveRequestsSwitch />}
        />
      </header>

      <div className="grid gap-6 min-[1200px]:grid-cols-[minmax(0,1fr)_22rem] min-[1200px]:items-start">
        <div className="min-w-0 space-y-4">
          <nav
            aria-label={MY_AVAILABILITY_TEXT.weekNavigation}
            ref={weekNavRef}
          className="sticky top-[calc(var(--spacing-app-header)+1rem)] z-20 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-background"
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
            <p className="ml-auto text-sm text-muted-foreground">
              {BOLIVIA_TIME_LABEL}
            </p>
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
                stickyOffset={weekNavHeight}
                onEditBlock={handleEditBlock}
                blockedDates={blockedDates}
                onSelectDate={handleSelectDate}
              />
            </>
          )}
        </div>

        <div
          className="min-w-0 space-y-4 min-[1200px]:sticky min-[1200px]:top-[calc(var(--spacing-app-header)+1rem)] min-[1200px]:max-h-[calc(100dvh-var(--spacing-app-header)-2rem)] min-[1200px]:overflow-y-auto"
        >
          {showBlockedPanel && (
            <BlockedDatePanel
              key={selectedDate}
              date={selectedDate}
              blockedDate={blockedDates.find(
                (item) => item.blockedOn === selectedDate,
              )}
              onClose={() => setSelectedDate(null)}
            />
          )}
          {showEditPanel && (
            <div className="animate-in duration-200 fade-in slide-in-from-right">
              {isLoading ? (
                <AvailabilityLoading />
              ) : (
                <EditBlockPanel
                  key={editBlockId}
                  block={editBlock}
                  onClose={handleClosePanel}
                />
              )}
            </div>
          )}
          <div hidden={showBlockedPanel || showEditPanel}>
            <BlockForm
              key={formKey}
              mode="create"
              isSubmitting={isSubmitting}
              onSubmit={handleCreate}
              onCancel={handleCancelCreate}
            />
          </div>
          <BlockedDatesList />
        </div>
      </div>
    </div>
  );
}
