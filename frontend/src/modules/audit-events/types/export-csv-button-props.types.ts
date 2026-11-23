export interface ExportCsvButtonProps {
  total: number;
  isExporting: boolean;
  disabled?: boolean;
  onExport: () => void;
}
