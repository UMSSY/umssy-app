export interface CompanyDocumentPanelProps {
  requestCode: string | null;
  docUrl: string | null;
  docIsImage: boolean;
  docMimeType: string;
  docError: string | null;
  isRetrying?: boolean;
  onRetry?: () => void;
}
