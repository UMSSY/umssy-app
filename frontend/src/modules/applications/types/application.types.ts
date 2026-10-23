export interface Application {
  id: string;
  vacancyTitle: string;
  companyName: string;
  affinityPercentage: number;
  status: 'En revisión' | 'Entrevista' | 'Aceptada' | 'No seleccionado';
  appliedDate: string;
}