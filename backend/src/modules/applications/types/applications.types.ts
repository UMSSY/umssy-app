export enum ApplicationStatus {
  IN_REVIEW = 'En revisión',
  INTERVIEW = 'Entrevista',
  ACCEPTED = 'Aceptada',
  REJECTED = 'No seleccionado',
  WITHDRAWN = 'Retirada',
}

export interface ApplicationItemResponse {
  id: string;
  vacancy: string;
  company: string;
  affinity: number;
  status: string;
  canWithdraw: boolean;
  createdAt: Date;
}