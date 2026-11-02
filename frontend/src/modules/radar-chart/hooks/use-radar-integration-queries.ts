'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { radarIntegrationApi } from '../services/radar-integration.service';
import type { ApplicantConsents, AxisId } from '../types/radar-integration.types';

/** Claves compartidas: todas las vistas deben invalidar la misma fuente. */
export const radarQueryKeys = {
  all: ['radar-integration'] as const,
  me: () => [...radarQueryKeys.all, 'me'] as const,
  reviews: () => [...radarQueryKeys.all, 'reviews'] as const,
  vacancies: () => [...radarQueryKeys.all, 'vacancies'] as const,
  recruiterVacancies: () => [...radarQueryKeys.all, 'recruiter-vacancies'] as const,
  applicants: (jobOfferId: string) => [...radarQueryKeys.all, 'applicants', jobOfferId] as const,
  areaEvidence: (applicationId: string, areaId: AxisId) =>
    [...radarQueryKeys.all, 'evidence', applicationId, areaId] as const,
  myApplications: () => [...radarQueryKeys.all, 'my-applications'] as const,
};

export function useRadarReviews() {
  return useQuery({
    queryKey: radarQueryKeys.reviews(),
    queryFn: radarIntegrationApi.reviews,
    refetchInterval: 30_000,
  });
}

export function useRecruiterVacancies() {
  return useQuery({
    queryKey: radarQueryKeys.recruiterVacancies(),
    queryFn: radarIntegrationApi.recruiterVacancies,
  });
}

export function useRecruiterApplicants(jobOfferId: string) {
  return useQuery({
    queryKey: radarQueryKeys.applicants(jobOfferId),
    queryFn: () => radarIntegrationApi.applicants(jobOfferId),
    enabled: Boolean(jobOfferId),
  });
}

export function useRecruiterAreaEvidence(applicationId: string, areaId: AxisId | null) {
  return useQuery({
    queryKey: [...radarQueryKeys.all, 'evidence', applicationId, areaId],
    queryFn: () => radarIntegrationApi.applicantAreaEvidence(applicationId, areaId!),
    enabled: Boolean(applicationId && areaId),
  });
}

export function useMyRadarApplications() {
  return useQuery({
    queryKey: radarQueryKeys.myApplications(),
    queryFn: radarIntegrationApi.applications,
  });
}

export function useRadarApplicationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: radarQueryKeys.all });
  const apply = useMutation({
    mutationFn: ({ jobOfferId, consents }: { jobOfferId: string; consents: ApplicantConsents }) =>
      radarIntegrationApi.apply(jobOfferId, consents),
    onSuccess: invalidate,
  });
  const updateConsents = useMutation({
    mutationFn: ({ id, consents }: { id: string; consents: ApplicantConsents }) =>
      radarIntegrationApi.updateConsents(id, consents),
    onSuccess: invalidate,
  });
  const withdraw = useMutation({
    mutationFn: (id: string) => radarIntegrationApi.withdraw(id),
    onSuccess: invalidate,
  });
  return { apply, updateConsents, withdraw };
}

export function useRadarReviewMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: radarQueryKeys.all });
  const decision = useMutation({
    mutationFn: ({ kind, id, decision }: { kind: 'cv' | 'skill'; id: string; decision: 'approved' | 'rejected' | 'revoked' }) =>
      radarIntegrationApi.decision(kind, id, decision),
    onSuccess: invalidate,
  });
  const reprocess = useMutation({
    mutationFn: (id: string) => radarIntegrationApi.adminReprocessCv(id),
    onSuccess: invalidate,
  });
  return { decision, reprocess };
}

export function useRecruiterDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'hired' | 'rejected' }) =>
      radarIntegrationApi.decide(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: radarQueryKeys.all }),
  });
}
