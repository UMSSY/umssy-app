"use client";

import { Button } from "@/components/ui/button";
import { toBoliviaTime } from "@/shared/utils/date-time";
import { cn } from "cn";
import {
  EMPTY_DAY_LABEL,
  SELECTED_BLOCK_CLASSES,
  STATE_BUTTON_CLASSES,
  STATE_BUTTON_VARIANT,
  STATE_LABELS_ES,
} from "../../constants/week-grid.constants";
import type { WeekDayListProps } from "../../types/week-day-list-props.types";
import { formatDayAndMonth } from "../../utils/calendar-date";
import { capitalize, isBlockClickable } from "../../utils/week-grid.utils";

export function WeekDayList({
  blocksByDay,
  dayDates,
  variant,
  blockedDates = [],
  onSelectDate,
  selectedBlockId,
  onBlockClick,
}: WeekDayListProps) {
  return (
    <ol className="flex flex-col gap-3 md:hidden">
      {blocksByDay.map((dayBlocks, dayIndex) => {
        const blockedDate = blockedDates.find((item) => item.blockedOn === dayDates[dayIndex]);
        const dayLabel = formatDayAndMonth(dayDates[dayIndex]);
        const sortedBlocks = [...dayBlocks].sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );

        return (
          <li key={dayDates[dayIndex]} className={cn("rounded-lg border border-border p-3", blockedDate && "bg-muted")}>
            <h3 aria-label={dayLabel} className="text-sm font-semibold">
              {variant === "owner" && onSelectDate ? <Button type="button" variant="ghost" className="h-auto max-w-full px-0 whitespace-normal" onClick={() => onSelectDate(dayDates[dayIndex])} aria-label={`Seleccionar fecha: ${dayLabel}`}>{dayLabel}</Button> : dayLabel}
            </h3>

            {blockedDate ? (
              <div className="mt-2 space-y-2 text-sm">
                <p className="font-semibold">Fecha bloqueada</p>
                {blockedDate.reason && <p className="wrap-anywhere">{blockedDate.reason}</p>}
                {variant === "owner" && onSelectDate && <Button type="button" variant="outline" onClick={() => onSelectDate(dayDates[dayIndex])}>Desbloquear fecha</Button>}
              </div>
            ) : sortedBlocks.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{EMPTY_DAY_LABEL}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {sortedBlocks.map((block) => {
                  const isSelected = block.id === selectedBlockId;
                  const stateLabel = STATE_LABELS_ES[block.state];
                  const timeRange = `${toBoliviaTime(block.startAt).time} a ${toBoliviaTime(block.endAt).time}`;

                  return (
                    <li key={block.id}>
                      <Button
                        type="button"
                        variant={STATE_BUTTON_VARIANT[block.state]}
                        disabled={!isBlockClickable(variant, block.state)}
                        onClick={() => onBlockClick(block)}
                        className={cn(
                          "w-full justify-between",
                          STATE_BUTTON_CLASSES[block.state],
                          isSelected && SELECTED_BLOCK_CLASSES
                        )}
                        aria-pressed={isSelected || undefined}
                        aria-label={`${dayLabel}, ${timeRange}, ${stateLabel}`}
                      >
                        <span>{timeRange}</span>
                        <span>{capitalize(stateLabel)}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
