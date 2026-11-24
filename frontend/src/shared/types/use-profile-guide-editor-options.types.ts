export interface UseProfileGuideEditorOptions {
  isBusy?: boolean;
  initiallyOpen?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}
