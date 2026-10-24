"use client";

import { Button } from "@/components/ui/button";
import { formatBlockRange, toBoliviaTime } from "@/shared/utils/date-time";
import { cn } from "cn";
import { BLOCKED_DATE_TEXT } from "../../constants/blocked-date.constants";
import {
  BLOCK_STATE_TEXT,
  DAY_LABELS,
  HOUR_HEIGHT_PX,
  SELECTED_BLOCK_CLASSES,
  SELECTED_LEGEND_LABEL,
  STATE_BUTTON_CLASSES,
  STATE_BUTTON_VARIANT,
  STATE_LABELS_ES,
  WEEK_GRID_END_HOUR,
  WEEK_GRID_LEGEND,
  WEEK_GRID_START_HOUR,
} from "../../constants/week-grid.constants";
import type { AvailabilityBlock } from "../../types/availability-block.types";
import type { WeekGridProps } from "../../types/week-grid-props.types";
import {
  getBlockVerticalPosition,
  getWeekDayDates,
  getWeekDayIndex,
  isBlockClickable,
} from "../../utils/week-grid.utils";
import { formatDayAndMonth } from "../../utils/calendar-date";
import { WeekDayList } from "./week-day-list";

export function WeekGrid({
  blocks,
  weekRange,
  variant,
  startHour = WEEK_GRID_START_HOUR,
  endHour = WEEK_GRID_END_HOUR,
  blockedDates = [],
  onSelectDate,
  selectedBlockId,
  onSelectBlock,
  onEditBlock,
  stickyOffset = 0,
}: WeekGridProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeightPx = hours.length * HOUR_HEIGHT_PX;
  const stickyTop = { top: `calc(var(--spacing-app-header) + ${stickyOffset}px)` };

  const dayDates = getWeekDayDates(weekRange);
  const blocksByDay: AvailabilityBlock[][] = Array.from({ length: 7 }, () => []);
  for (const block of blocks) {
    const dayIndex = getWeekDayIndex(block.startAt, weekRange);
    if (dayIndex !== null) blocksByDay[dayIndex].push(block);
  }

  function handleBlockClick(block: AvailabilityBlock) {
    if (!isBlockClickable(variant, block.state)) return;
    if (variant === "selectable") onSelectBlock?.(block);
    if (variant === "owner") onEditBlock?.(block);
  }

  return (
    <section aria-label="Disponibilidad semanal">
      <div
        className={cn(
          "hidden overflow-clip rounded-lg border border-border",
          "md:grid md:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]",
        )}
      >
        <div aria-hidden="true">
          <div className="sticky z-10 h-10 border-b border-app-header-foreground/15 bg-app-header" style={stickyTop} />
          <ol className="relative" style={{ height: gridHeightPx }}>
            {hours.map((h) => (
              <li
                key={h}
                className="absolute right-2 text-xs text-muted-foreground"
                style={{ top: (h - startHour) * HOUR_HEIGHT_PX + 4 }}
              >
                <time dateTime={`${String(h).padStart(2, "0")}:00`}>
                  {String(h).padStart(2, "0")}:00
                </time>
              </li>
            ))}
          </ol>
        </div>

        {blocksByDay.map((dayBlocks, dayIndex) => {
          const blockedDate = blockedDates.find((item) => item.blockedOn === dayDates[dayIndex]);
          return (
            <section key={dayIndex} className={cn("min-w-0 border-l border-border", blockedDate && "bg-muted")}>
              <h3 aria-label={`${DAY_LABELS[dayIndex]} ${Number(dayDates[dayIndex].slice(8))}`} className="sticky z-10 flex h-10 items-center gap-1.5 border-b border-app-header-foreground/15 bg-app-header px-2 text-app-header-foreground" style={stickyTop}>
                {variant === "owner" && onSelectDate ? (
                  <Button type="button" variant="ghost" className="h-auto w-full px-0 text-xs text-app-header-foreground hover:bg-app-header-foreground/15 hover:text-app-header-foreground" onClick={() => onSelectDate(dayDates[dayIndex])} aria-label={`${BLOCKED_DATE_TEXT.selectDate}: ${formatDayAndMonth(dayDates[dayIndex])}`}>
                    {DAY_LABELS[dayIndex]} {Number(dayDates[dayIndex].slice(8))}
                  </Button>
                ) : <><span className="text-xs font-semibold text-app-header-foreground/80">
                  {DAY_LABELS[dayIndex]}
                </span>{" "}
                <span className="text-base font-bold">{Number(dayDates[dayIndex].slice(8))}</span></>}
              </h3>

              <div className="relative" style={{ height: gridHeightPx }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    aria-hidden="true"
                    className="absolute w-full border-t border-border"
                    style={{ top: (h - startHour) * HOUR_HEIGHT_PX }}
                  />
                ))}

                {blockedDate ? (
                  <div className="relative space-y-2 p-1.5 text-xs hyphens-auto">
                    <p className="font-semibold">{BLOCKED_DATE_TEXT.blockedDay}</p>
                    {blockedDate.reason && <p className="break-words">{blockedDate.reason}</p>}
                    {variant === "owner" && onSelectDate && <Button type="button" variant="outline" size="sm" className="h-auto w-full px-1 text-xs hyphens-auto whitespace-normal" onClick={() => onSelectDate(dayDates[dayIndex])}>{BLOCKED_DATE_TEXT.unblockTitle}</Button>}
                  </div>
                ) : <ul>
                  {dayBlocks.map((block) => {
                    const { topPx, heightPx } = getBlockVerticalPosition(
                      block.startAt,
                      block.endAt,
                      startHour,
                      endHour
                    );
                    if (heightPx <= 0) return null;

                    const isSelected = block.id === selectedBlockId;
                    const stateLabel = STATE_LABELS_ES[block.state];
                    const startTime = toBoliviaTime(block.startAt).time;
                    const timeRange = `${startTime} a ${toBoliviaTime(block.endAt).time}`;

                    return (
                      <li
                        key={block.id}
                        className="absolute inset-x-1 py-px"
                        style={{ top: topPx, height: heightPx }}
                      >
                        <Button
                          type="button"
                          variant={STATE_BUTTON_VARIANT[block.state]}
                          disabled={!isBlockClickable(variant, block.state)}
                          onClick={() => handleBlockClick(block)}
                          className={cn(
                            "size-full flex-col items-start justify-start gap-0 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs leading-[15px] font-semibold",
                            STATE_BUTTON_CLASSES[block.state],
                            isSelected && SELECTED_BLOCK_CLASSES
                          )}
                          aria-pressed={isSelected || undefined}
                          aria-label={`${stateLabel}, ${timeRange}`}
                          title={`${BLOCK_STATE_TEXT[block.state]} · ${formatBlockRange(block.startAt, block.endAt)}`}
                        >
                          <span className="w-full truncate">{BLOCK_STATE_TEXT[block.state]}</span>
                          <span className="w-full truncate font-normal">{startTime}</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>}
              </div>
            </section>
          );
        })}
      </div>

      <WeekDayList
        blocksByDay={blocksByDay}
        dayDates={dayDates}
        variant={variant}
        selectedBlockId={selectedBlockId}
        onBlockClick={handleBlockClick}
        blockedDates={blockedDates}
        onSelectDate={onSelectDate}
      />

      <ul
        aria-label="Leyenda"
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
      >
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("inline-block h-3 w-4 rounded-sm border", STATE_BUTTON_CLASSES.free)}
          />
          {variant === "selectable" ? WEEK_GRID_LEGEND.freeSlot : WEEK_GRID_LEGEND.free}
        </li>
        {variant === "selectable" ? (
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("inline-block h-3 w-4 rounded-sm", SELECTED_BLOCK_CLASSES)}
            />
            {SELECTED_LEGEND_LABEL}
          </li>
        ) : (
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("inline-block h-3 w-4 rounded-sm border", STATE_BUTTON_CLASSES.confirmed)}
            />
            {WEEK_GRID_LEGEND.confirmed}
          </li>
        )}
        {variant === "owner" && onSelectDate && (
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-4 rounded-sm border border-border bg-muted"
            />
            {BLOCKED_DATE_TEXT.blockedDay}
          </li>
        )}
      </ul>
    </section>
  );
}
