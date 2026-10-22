import type { AvailabilityBlock } from "./availability-block.types";

export interface AvailabilityBlockEditorProps {
  block?: AvailabilityBlock | null;
  onClose: () => void;
  onCreated: (block: AvailabilityBlock) => void;
}
