import type { WeekRange } from "@/shared/types/week-range.types";
import type { AvailabilityBlock } from "./availability-block.types";
import type { WeekGridDensity } from "./week-grid-density.types";

export interface BlockSelectionProps {
  mentorId: string;
  blocks: AvailabilityBlock[];
  weekRange: WeekRange;
  fetchFreeBlocks: () => Promise<AvailabilityBlock[]>;
  stickyOffset?: number;
  density?: WeekGridDensity;
  onActivityChange?: (hasSelectionOrDraft: boolean) => void;
}
