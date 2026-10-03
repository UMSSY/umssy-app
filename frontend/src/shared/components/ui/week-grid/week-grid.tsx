"use client";

import {
  AvailabilityBlock,
  AvailabilityBlockState,
} from "@/modules/availability/types/availability";
import {
  DAY_LABELS,
  HOUR_HEIGHT_PX,
  formatBoliviaTime,
  getBlockVerticalPosition,
  getWeekDayIndex,
} from "../week-grid/week-grid.utils";

export type WeekGridVariant = "owner" | "public" | "selectable";

export interface WeekGridProps {
  blocks: AvailabilityBlock[];
  weekStart: Date;
  variant: WeekGridVariant;
  startHour?: number;
  endHour?: number;
  onSelectBlock?: (block: AvailabilityBlock) => void;
  onEditBlock?: (block: AvailabilityBlock) => void;
}

const STATE_STYLES: Record<AvailabilityBlockState, string> = {
  free: "border border-border bg-background",
  pending: "border border-dashed border-amber-500 bg-background",
  confirmed: "border border-ink bg-ink text-white",
};

// español para el usuario
const STATE_LABELS_ES: Record<AvailabilityBlockState, string> = {
  free: "libre",
  pending: "pendiente",
  confirmed: "confirmada",
};

export function WeekGrid({
  blocks,
  weekStart,
  variant,
  startHour = 7,
  endHour = 22,
  onSelectBlock,
  onEditBlock,
}: WeekGridProps) {
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const gridHeightPx = hours.length * HOUR_HEIGHT_PX;

  // agrupa los bloques por día (0=lunes) y descarta los que caen fuera de la semana
  const blocksByDay: AvailabilityBlock[][] = Array.from({ length: 7 }, () => []);
  for (const block of blocks) {
    const dayIndex = getWeekDayIndex(block.startAt, weekStart);
    if (dayIndex !== null) blocksByDay[dayIndex].push(block);
  }

  function handleBlockClick(block: AvailabilityBlock) {
    if (variant === "selectable" && block.state === "free") {
      onSelectBlock?.(block);
    }
    if (variant === "owner" && block.state === "free") {
      onEditBlock?.(block);
    }
  }

  return (
    <section aria-label="Disponibilidad semanal">
      <div className="grid grid-cols-[2.5rem_repeat(7,1fr)] rounded-lg border border-border overflow-hidden">
        <div aria-hidden="true">
          <div className="py-1 text-[10px]">&nbsp;</div>
          <ol className="relative" style={{ height: gridHeightPx }}>
            {hours.map((h) => (
              <li
                key={h}
                className="absolute right-1 text-[9px] text-muted-foreground"
                style={{ top: (h - startHour) * HOUR_HEIGHT_PX - 5 }}
              >
                <time dateTime={`${String(h).padStart(2, "0")}:00`}>
                  {String(h).padStart(2, "0")}:00
                </time>
              </li>
            ))}
          </ol>
        </div>

        {blocksByDay.map((dayBlocks, dayIndex) => (
          <section key={dayIndex} className="border-l border-border">
            <h3 className="text-center text-[10px] font-normal text-muted-foreground py-1">
              {DAY_LABELS[dayIndex]}
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

              <ul>
                {dayBlocks.map((block) => {
                  const { topPx, heightPx } = getBlockVerticalPosition(
                    block.startAt,
                    block.endAt,
                    startHour,
                    endHour
                  );
                  if (heightPx <= 0) return null;

                  const clickable =
                    (variant === "selectable" || variant === "owner") &&
                    block.state === "free";

                  return (
                    <li
                      key={block.id}
                      className="absolute left-0.5 right-0.5"
                      style={{ top: topPx, height: heightPx }}
                    >
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => handleBlockClick(block)}
                        className={`h-full w-full rounded text-[9px] px-1 flex items-center justify-center ${STATE_STYLES[block.state]} ${clickable ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
                        aria-label={`${STATE_LABELS_ES[block.state]}, ${formatBoliviaTime(block.startAt)} a ${formatBoliviaTime(block.endAt)}`}
                      >
                        {block.state === "free"
                          ? "Libre"
                          : formatBoliviaTime(block.startAt)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* leyenda de colores */}
      <ul
        aria-label="Leyenda"
        className="flex gap-4 mt-2 text-[10px] text-muted-foreground"
      >
        <li className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-sm border border-border"
          />
          Libre
        </li>
        <li className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-sm border border-dashed border-amber-500"
          />
          Solicitud pendiente
        </li>
        <li className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-sm bg-ink"
          />
          Cita confirmada
        </li>
      </ul>
    </section>
  );
}