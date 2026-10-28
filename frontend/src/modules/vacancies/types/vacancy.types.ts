export interface PublishedJobOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  modality: string;
  contractType: string;
  status: string;
  positionsAvailable: number;
  salaryRange: string;
  languages: string;
  locationUrl: string;
  expiresAt: string | null;
  createdAt: string;
  company: { id: string; name: string };
  skills: Array<{ id: string; name: string }>;
}

export interface Vacancy {
  id: string;
  cargo: string;
  empresa: string;
  descripcion: string;
  requisitos: string[];
  salario: string;
  modalidad: string;
  tipoContrato: string;
  idiomas: string;
  vacantes: number;
  ubicacionUrl: string;
}
