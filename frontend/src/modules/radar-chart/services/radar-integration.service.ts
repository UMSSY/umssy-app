import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type {
  IntegrationRadar,
  ReviewRow,
} from '../types/radar-integration.types';
import type {
  RadarNotification,
  OpenedRadarNotification,
} from '../types/radar-notification.types';

const root = '/profile/me/radar';

const extract = <T>(response: { data: ApiResponse<T> }): T =>
  response.data.data;

export type RadarReviewKind = 'cv' | 'skill';
export type RadarReviewDecision = 'approved' | 'rejected' | 'revoked';

export interface RadarReviewOperationResult {
  operationId: string;
  status: 'completed';
  kind: RadarReviewKind;
  targetId: string;
  decision: RadarReviewDecision;
  changed: boolean;
  userId: string | null;
  completedAt: string;
}

export const radarIntegrationApi = {
  me: async () =>
    extract(await apiClient.get<ApiResponse<IntegrationRadar>>(root)),

  notifications: async () =>
    extract(
      await apiClient.get<ApiResponse<RadarNotification[]>>(
        `${root}/notifications`,
      ),
    ),

  openNotification: async (id: string) =>
    extract(
      await apiClient.post<ApiResponse<OpenedRadarNotification>>(
        `${root}/notifications/${id}/open`,
      ),
    ),

  recalculate: async () =>
    extract(
      await apiClient.post<ApiResponse<IntegrationRadar>>(
        `${root}/recalculations`,
      ),
    ),

  rescanCurrentCv: async () =>
    extract(
      await apiClient.post<ApiResponse<{ cvId: string; submitted: boolean }>>(
        `${root}/cv-rescans`,
      ),
    ),

  reviews: async () =>
    extract(await apiClient.get<ApiResponse<ReviewRow[]>>('/radar-reviews')),

  decision: async (
    kind: RadarReviewKind,
    id: string,
    operationId: string,
    decision: RadarReviewDecision,
  ) =>
    extract(
      await apiClient.patch<ApiResponse<RadarReviewOperationResult>>(
        `/radar-reviews/${kind}/${id}`,
        { operationId, decision },
      ),
    ),

  documentDecision: async (
    id: string,
    operationId: string,
    decision: RadarReviewDecision,
  ) =>
    extract(
      await apiClient.patch<ApiResponse<RadarReviewOperationResult>>(
        `/radar-document-reviews/${id}`,
        { operationId, decision },
      ),
    ),

  operationStatus: async (operationId: string) =>
    extract(
      await apiClient.get<ApiResponse<RadarReviewOperationResult>>(
        `/radar-reviews/operations/${operationId}`,
      ),
    ),

  documentOperationStatus: async (operationId: string) =>
    extract(
      await apiClient.get<ApiResponse<RadarReviewOperationResult>>(
        `/radar-document-reviews/operations/${operationId}`,
      ),
    ),

  adminReprocessCv: async (id: string) =>
    extract(
      await apiClient.post<
        ApiResponse<{
          cvId: string;
          extractionStatus: string;
          extractedCharacters: number;
          reviewStatus: string;
          nlpStatus: string;
        }>
      >(`/radar-reviews/cvs/${id}/reprocessings`),
    ),

  adminCv: async (id: string) => {
    const response = await apiClient.get<Blob>(
      `/radar-reviews/cvs/${id}/file`,
      { responseType: 'blob' },
    );
    return response.data;
  },
};

export type {
  IntegrationRadar,
  ReviewRow,
  Scores,
  RadarNotification,
  OpenedRadarNotification,
} from '../types/radar-integration.types';
