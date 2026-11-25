export interface CompanyMetadataCardProps {
  statusLabel: string;
  requestCode: string | null;
  submittedAt: string | null;
  ocrPercentage: number;
  canResolve: boolean;
  onOpenResolution: () => void;
}
