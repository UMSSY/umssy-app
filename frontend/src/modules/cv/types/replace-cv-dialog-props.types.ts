export interface ReplaceCvDialogProps {
  file: File | null;
  currentFileName?: string;
  isReplacing?: boolean;
  uploadProgress?: number;
  errorMessage?: string | null;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}
