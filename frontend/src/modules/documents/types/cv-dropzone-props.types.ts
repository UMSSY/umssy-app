import type { ReactNode } from "react";

export interface CvDropzoneProps {
  title: string;
  description?: string;
  selectLabel: string;
  icon?: ReactNode;
  isDisabled?: boolean;
  isUploading?: boolean;
  isSelectPending?: boolean;
  progress?: number;
  onSelectFile: () => void;
  onFileDropped: (file: File) => void;
  children?: ReactNode;
}
