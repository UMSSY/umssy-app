export enum ApplicationStatus {
  IN_REVIEW = 'En revisión',
  INTERVIEW = 'Entrevista',
  ACCEPTED = 'Aceptada',
  REJECTED = 'No seleccionado',
  WITHDRAWN = 'Retirada',
}

export interface ApplicationItemResponse {
  id: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyName: string;
  affinityPercentage: number;
  status: string;
  appliedDate: string;
}
