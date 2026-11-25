import type { RefObject } from 'react';

export interface PresentationLeaveDialogProps {
  dirty: boolean;
  isSaving: boolean;
  returnFocus: RefObject<HTMLElement | null>;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
}
