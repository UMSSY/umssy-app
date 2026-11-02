import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type { AreaEvidenceDetails } from '../components/radar-area-details-dialog';
import type { IntegrationRadar, ReviewRow, RealVacancy, AxisId, RecruiterResponse, ApplicationSummary, ApplicantConsents } from '../types/radar-integration.types';
const root='/radar-integration';
const extract=<T,>(r:{data:ApiResponse<T>})=>r.data.data;
export const radarIntegrationApi={
  me:async()=>extract(await apiClient.get<ApiResponse<IntegrationRadar>>(`${root}/me`)),
  recalculate:async()=>extract(await apiClient.post<ApiResponse<IntegrationRadar>>(`${root}/me/recalculate`)),
  rescanCurrentCv:async()=>extract(await apiClient.post<ApiResponse<{cvId:string;submitted:boolean}>>(`${root}/me/cv-rescan`)),
  reviews:async()=>extract(await apiClient.get<ApiResponse<ReviewRow[]>>(`${root}/admin/queue`)),
  decision:async(kind:string,id:string,decision:string)=>extract(await apiClient.patch<ApiResponse<IntegrationRadar>>(`${root}/admin/reviews/${kind}/${id}`,{decision})),
  adminReprocessCv:async(id:string)=>extract(await apiClient.post<ApiResponse<{cvId:string;extractionStatus:string;extractedCharacters:number;reviewStatus:string;nlpStatus:string}>>(`${root}/admin/cv/${id}/reprocess`)),
  adminCv:async(id:string)=>{const res=await apiClient.get<Blob>(`${root}/admin/cv/${id}/file`,{responseType:'blob'});return res.data;},
  applicantAreaEvidence:async(id:string,areaId:AxisId)=>extract(await apiClient.get<ApiResponse<AreaEvidenceDetails>>(`${root}/recruiter/applications/${id}/areas/${areaId}/evidence`)),
  recruiterCv:async(id:string)=>{const res=await apiClient.get<Blob>(`${root}/recruiter/applications/${id}/cv`,{responseType:'blob'});return res.data;},
  vacancies:async()=>extract(await apiClient.get<ApiResponse<RealVacancy[]>>(`${root}/vacancies`)),
  recruiterVacancies:async()=>extract(await apiClient.get<ApiResponse<RealVacancy[]>>(`${root}/recruiter/vacancies`)),
  applicants:async(id:string)=>extract(await apiClient.get<ApiResponse<RecruiterResponse>>(`${root}/recruiter/vacancies/${id}/applicants`)),
  decide:async(id:string,decision:'hired'|'rejected')=>extract(await apiClient.patch<ApiResponse<{state:string}>>(`${root}/recruiter/applications/${id}`,{decision})),
  applications:async()=>extract(await apiClient.get<ApiResponse<ApplicationSummary[]>>(`${root}/me/applications`)),
  apply:async(jobOfferId:string,consents:ApplicantConsents)=>extract(await apiClient.post<ApiResponse<ApplicationSummary>>(`${root}/applications`,{jobOfferId,...consents})),
  updateConsents:async(id:string,consents:ApplicantConsents)=>extract(await apiClient.patch<ApiResponse<ApplicationSummary>>(`${root}/me/applications/${id}/consents`,consents)),
  withdraw:async(id:string)=>extract(await apiClient.patch<ApiResponse<{id:string;state:string}>>(`${root}/me/applications/${id}/withdraw`)),
};
