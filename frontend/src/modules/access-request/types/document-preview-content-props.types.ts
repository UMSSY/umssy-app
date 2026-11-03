import type { DocumentState } from "./access-request-context.types";

export interface DocumentPreviewContentProps {
  document: DocumentState;
  isDisabled?: boolean;
  isRemoving?: boolean;
  onRemove: () => void | Promise<void>;
}
