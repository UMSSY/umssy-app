export interface DocumentDropzoneContentProps {
  isDisabled?: boolean;
  isUploading?: boolean;
  progress?: number;
  error?: string | null;
  onFileSelected: (file: File) => void | Promise<void>;
}
