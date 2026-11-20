import type { PushGuideKind } from "./push-guide-kind.types";

export interface PushGuideDialogProps {
  kind: PushGuideKind | null;
  onClose: () => void;
}
