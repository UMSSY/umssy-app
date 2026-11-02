import { RADAR_AXES } from '../constants/radar-axes.constants';
export type AxisId=(typeof RADAR_AXES)[number]['id'];
export type Scores=Record<AxisId,number>;
export interface IntegrationRadar {dictionaryVersion?:string|null;userId:string;status:string;version:number;rubricVersion:string;updatedAt:string|null;scores:Scores;average:number;variation:number|null;pending:number;hasPending:boolean;evidence:Record<string,{id:string;name:string}[]>;sourceRevision:number|null;inputRevision:number;processingStatus:'ready'|'pending'|'error';skills:{id:string;name:string;areaId:string|null;isHighRelevance:boolean;evidenceRefs:{type:string;id:string}[]}[]}
export interface ReviewRow {id:string;userId:string;userName:string;type:'cv'|'skill';title:string;status:string;date:string;extractionStatus?:string;extractedCharacters?:number;areaId?:string;evidenceRefs?:unknown}
export interface RealVacancy {id:string;title:string;companyId:string;description?:string}
export interface CandidateRow {applicationId:string;userId:string|null;name:string;headline:string;email:string|null;phone:string|null;appliedAt:string;state:string;canViewCv:boolean;version:number|null;average?:number|null;scores:Scores|null;evidence:Record<string,{id:string;name:string}[]>;comparison:{match:number;gaps:Scores}|null;skills:string[]}
export interface ApplicationSummary {id:string;jobOfferId:string;state:'applied'|'interview'|'hired'|'rejected'|'withdrawn';appliedAt:string;consent:boolean;consentCv:boolean;consentContact:boolean}
export interface ApplicantConsents {consent:boolean;consentCv:boolean;consentContact:boolean}
export interface RecruiterResponse {vacancy:{id:string;title:string;target:Scores};applicants:CandidateRow[]}
