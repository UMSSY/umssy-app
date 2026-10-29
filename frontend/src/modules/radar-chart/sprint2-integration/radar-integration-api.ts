import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type { AreaEvidenceDetails } from '../sprint2/radar-area-details-dialog';

export const RADAR_AXES=[
  {id:'desarrollo',name:'Desarrollo'},
  {id:'cloud-devops',name:'Cloud/DevOps'},
  {id:'data-ai',name:'Data/AI'},
  {id:'qa',name:'QA'},
  {id:'ciberseguridad',name:'Ciberseguridad'},
  {id:'gobernanza-ti',name:'Gobernanza TI'},
] as const;
export type AxisId=(typeof RADAR_AXES)[number]['id'];
export type Scores=Record<AxisId,number>;
export interface IntegrationRadar {dictionaryVersion?:string|null;userId:string;status:string;version:number;rubricVersion:string;updatedAt:string|null;scores:Scores;average:number;variation:number|null;pending:number;hasPending:boolean;evidence:Record<string,{id:string;name:string}[]>;sourceRevision:number|null;inputRevision:number;processingStatus:'ready'|'pending'|'error';skills:{id:string;name:string;areaId:string|null;isHighRelevance:boolean;evidenceRefs:{type:string;id:string}[]}[]}
export interface ReviewRow {id:string;userId:string;userName:string;type:'cv'|'skill';title:string;status:string;date:string;extractionStatus?:string;extractedCharacters?:number;areaId?:string;evidenceRefs?:unknown}
export interface RealVacancy {id:string;title:string;companyId:string;description?:string}
export interface CandidateRow {applicationId:string;userId:string;name:string;headline:string;email:string|null;phone:string|null;appliedAt:string;state:string;canViewCv:boolean;version:number|null;scores:Scores|null;evidence:Record<string,{id:string;name:string}[]>;comparison:{match:number;gaps:Scores}|null;skills:string[]}
export interface ApplicationSummary {id:string;jobOfferId:string;state:'applied'|'hired'|'rejected'|'withdrawn';appliedAt:string;consent:boolean;consentCv:boolean;consentContact:boolean}
export interface ApplicantConsents {consent:boolean;consentCv:boolean;consentContact:boolean}
export interface RecruiterResponse {vacancy:{id:string;title:string;target:Scores};applicants:CandidateRow[]}
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
