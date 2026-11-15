export interface CvUploadCardProps {
  selectedFile: File | null;
  hasSavedCv: boolean;
  isLoading?: boolean;
  isUploading: boolean;
  isBusy: boolean;
  uploadProgress: number;
  onSelectFile: () => void;
  onFileDropped: (file: File) => void;
  onConfirmUpload: (file: File) => void;
}
