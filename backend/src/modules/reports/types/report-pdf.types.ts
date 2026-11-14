export interface ReportPdfFilter {
  readonly label: string;
  readonly value: string;
}

export interface ReportPdfColumn {
  readonly label: string;
  readonly width: number;
}

export interface ReportPdfDefinition {
  readonly title: string;
  readonly subtitle: string;
  readonly dateColumnLabel: string;
  readonly dateFilterLabel: string;
}

export interface ReportPdfContent extends ReportPdfDefinition {
  readonly generatedBy: string;
  readonly generatedAt: Date;
  readonly filters: readonly ReportPdfFilter[];
  readonly rows: readonly (readonly string[])[];
}

export interface ReportPdfFile {
  readonly fileName: string;
  readonly content: Buffer;
}

export interface ReportPdfFiltersInput {
  readonly userType?: string;
  readonly period?: string;
  readonly search?: string;
}
