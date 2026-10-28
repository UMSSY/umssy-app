export type ApplicationStatus = "En revisión" | "Entrevista" | "Aceptada" | "No seleccionado";

export interface Application {
  id: string;
  vacancyTitle: string;
  companyName: string;
  affinityPercentage: number;
  status: ApplicationStatus;
  appliedDate: string;
}
