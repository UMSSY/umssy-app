import type { DocumentState } from "./document-state.types";

export interface DocumentPreviewContentProps {
  document: DocumentState;
  isDisabled?: boolean;
  isRemoving?: boolean;
  onRemove: () => void | Promise<void>;
}
