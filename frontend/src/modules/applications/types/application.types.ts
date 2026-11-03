export type ApplicationStatus = "En revisión" | "Entrevista" | "Aceptada" | "No seleccionado" | "Retirada";

export interface Application {
  id: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyName: string;
  affinityPercentage: number;
  status: ApplicationStatus;
  appliedDate: string;
}
