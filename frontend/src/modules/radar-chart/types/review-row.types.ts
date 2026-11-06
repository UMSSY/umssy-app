export interface ReviewRow {
  id: string;
  userId: string;
  userName: string;
  type: "cv" | "skill";
  title: string;
  status: string;
  date: string;
  extractionStatus?: string;
  extractedCharacters?: number;
  areaId?: string;
  evidenceRefs?: unknown;
}
