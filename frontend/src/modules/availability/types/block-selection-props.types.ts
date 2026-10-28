import type { WeekRange } from "@/shared/types/week-range.types";
import type { AvailabilityBlock } from "./availability-block.types";

export interface BlockSelectionProps {
  mentorId: string;
  blocks: AvailabilityBlock[];
  weekRange: WeekRange;
  fetchFreeBlocks: () => Promise<AvailabilityBlock[]>;
  stickyOffset?: number;
}
