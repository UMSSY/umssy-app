import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';

export interface VacancyOffer {
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
  expiresAt: string | null;
  company: { id: string; name: string };
  skills: { id: string; name: string }[];
}

export const vacanciesService = {
  async list(): Promise<VacancyOffer[]> {
    const response = await apiClient.get<ApiResponse<VacancyOffer[]>>('/job-offers');
    return response.data.data;
  },
};

// Conserva el contrato que consume la administración de vacantes.
export async function deleteVacancy(companyId: string, id: string): Promise<void> {
  await apiClient.delete(`/companies/${encodeURIComponent(companyId)}/job-offers/${encodeURIComponent(id)}`);
}
