import type { ReactNode } from "react";

export interface RecordEditorDialogProps {
  title: string;
  description: string;
  isBusy?: boolean;
  hasUnsavedChanges?: boolean;
  onClose: () => void;
  children: (requestClose: () => void) => ReactNode;
}
