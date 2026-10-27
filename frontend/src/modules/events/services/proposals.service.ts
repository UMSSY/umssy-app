import { apiClient } from '@/shared/services/api-client';
import { PROPOSAL_ENDPOINT } from '../constants/proposal.constants';
import type { CreatedProposal, ProposalValues } from '../types/proposal.types';
import { readCount, readRecord, readString } from '../utils/response-validation';

export const proposalsService = {
  async create(values: ProposalValues, cover: File, requestId: string, accessToken?: string | null): Promise<CreatedProposal> {
    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => payload.append(key, value.trim()));
    payload.append('cover', cover);
    const response = await apiClient.post<unknown>(PROPOSAL_ENDPOINT, payload, {
      headers: { 'Idempotency-Key': requestId, ...(accessToken !== undefined && { Authorization: accessToken ? `Bearer ${accessToken}` : '' }) },
      timeout: 60000,
    });
    const data = readRecord(readRecord(response.data).data);
    const id = readString(data.id);
    const coverUrl = readString(data.coverUrl);
    const votingDeadline = readString(data.votingDeadline);
    const supportThreshold = readCount(data.supportThreshold);
    if (!id || !coverUrl || data.status !== 'voting' || supportThreshold < 8 || Number.isNaN(Date.parse(votingDeadline))) {
      throw new Error('No se pudo verificar el registro. Reintenta para consultar el resultado de la misma operación.');
    }
    return { id, coverUrl, status: 'voting', votingDeadline, supportThreshold };
  },
};
