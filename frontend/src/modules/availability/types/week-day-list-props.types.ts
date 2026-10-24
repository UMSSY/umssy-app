import type { BlockedDate } from "./blocked-date.types";
import type { AvailabilityBlock } from "./availability-block.types";
import type { WeekGridVariant } from "./week-grid-variant.types";

export interface WeekDayListProps {
  blocksByDay: AvailabilityBlock[][];
  dayDates: string[];
  variant: WeekGridVariant;
  blockedDates?: BlockedDate[];
  onSelectDate?: (date: string) => void;
  selectedBlockId?: string;
  onBlockClick: (block: AvailabilityBlock) => void;
}
