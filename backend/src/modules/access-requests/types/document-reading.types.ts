export interface DocumentReading {
  isDiploma: boolean;
  documentKind?: 'supported' | 'unsupported' | 'unknown';
  confidence: number;
  fullName: string | null;
  career: string | null;
  graduationYear: number | null;
}
