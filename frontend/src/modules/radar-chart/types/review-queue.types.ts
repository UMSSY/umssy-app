export type ReviewProfileStatus =
  | "Completado"
  | "Procesando"
  | "Pendiente";

export type ReviewQueueFilter = "Todos" | ReviewProfileStatus;

export type ReviewAffinityLevel =
  | "Experto"
  | "Avanzado"
  | "Intermedio"
  | "Base";

export interface ReviewAffinityArea {
  area: string;
  level: ReviewAffinityLevel;
  score: number;
}

export interface ReviewProfile {
  id: number;
  name: string;
  targetRole: string;
  submittedAt: string;
  globalAffinity: number;
  status: ReviewProfileStatus;
  areas: ReviewAffinityArea[];
}
export type ReviewAction = "approved" | "rejected";