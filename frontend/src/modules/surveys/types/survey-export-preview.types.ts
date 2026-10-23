export interface SurveyExportPreview {
  file: Blob;
  // URL temporal del PDF para mostrarlo en la vista previa.
  url: string;
  fileName: string;
}

export interface SurveyExportPreviewDialogProps {
  preview: SurveyExportPreview | null;
  onDownload: () => void;
  onClose: () => void;
}
