export interface ReportPdfFilter {
  label: string;
  value: string;
}

export interface ReportPdfOptions {
  title: string;
  subtitle: string;
  dateColumnLabel: string;
  filters: ReportPdfFilter[];
}

export interface ReportPdfMetadata extends ReportPdfOptions {
  generatedBy: string;
  generatedAt?: Date;
}
