import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { Vacancy } from "../data/vacancies";

interface JobOfferApi {
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
  company: {
    id: string;
    name: string;
  };
  skills: {
    id: string;
    name: string;
  }[];
}

function mapJobOffer(offer: JobOfferApi): Vacancy {
  return {
    id: offer.id,
    cargo: offer.title,
    empresa: offer.company.name,
    descripcion: offer.description,
    requisitos: offer.skills.map((skill) => skill.name),
    salario: offer.salaryRange || "No especificado",
    ubicacion: offer.locationUrl || "No especificada",
    tipoContrato: offer.contractType || "No especificado",
    jornada: offer.modality || "No especificada",
  };
}

export const vacanciesService = {
  getPublished: async (): Promise<Vacancy[]> => {
    const response =
      await apiClient.get<ApiResponse<JobOfferApi[]>>("/job-offers");

    return (response.data.data ?? []).map(mapJobOffer);
  },
};
