import type { ReactNode } from "react";
import type { AvailabilityBlock } from "./availability-block.types";

export interface BlockSelectionPanelProps {
  selectedBlock: AvailabilityBlock | null;
  unavailableBlock: AvailabilityBlock | null;
  isChecking: boolean;
  error: string | null;
  children?: ReactNode;
}
