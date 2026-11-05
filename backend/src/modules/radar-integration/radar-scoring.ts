import { createHash } from 'node:crypto';

export const AREA_IDS = ['desarrollo','cloud-devops','data-ai','qa','ciberseguridad','gobernanza-ti'] as const;
export type RadarAreaId = (typeof AREA_IDS)[number];
export type Scores = Record<RadarAreaId,number>;
export const RUBRIC_VERSION = 'epic3-provisional-1'; // Pendiente de aprobación formal del PO.
export const emptyScores = (): Scores => Object.fromEntries(AREA_IDS.map(id => [id,0])) as Scores;
export interface EvidenceSkill { id:string; name:string; areaId:string|null; isHighRelevance:boolean; evidenceRefs?:readonly {type:string;id:string}[] }
export function scoreVerifiedSkills(skills: readonly EvidenceSkill[]): {scores:Scores; evidence:Record<string,{id:string;name:string}[]>; average:number; fingerprint:string} {
  const scores=emptyScores();
  const evidence: Record<string,{id:string;name:string}[]> = Object.fromEntries(AREA_IDS.map(a=>[a,[]]));
  const unique=new Map(skills.map(s=>[s.id,s]));
  for(const s of [...unique.values()].sort((a,b)=>a.id.localeCompare(b.id))) {
    if(!AREA_IDS.some(id=>id===s.areaId)) continue;
    const id=s.areaId as RadarAreaId;
    scores[id]=Math.min(10,scores[id]+1+(s.isHighRelevance?0.5:0));
    evidence[id].push({id:s.id,name:s.name});
  }
  const average=Number((AREA_IDS.reduce((t,id)=>t+scores[id],0)/6).toFixed(2));
  const fingerprint=createHash('sha256').update(JSON.stringify({rubric:RUBRIC_VERSION,skills:[...unique.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(s=>({...s,evidenceRefs:[...(s.evidenceRefs??[])].sort((a,b)=>`${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`))}))})).digest('hex');
  return {scores,evidence,average,fingerprint};
}
export function matchRadar(candidate:Scores,target:Scores):{match:number;gaps:Scores} {
  const gaps=emptyScores();
  for(const id of AREA_IDS) gaps[id]=Math.round((candidate[id]-target[id])*10)/10;
  const match=Math.round(Math.max(0,Math.min(100,100-AREA_IDS.reduce((sum,id)=>sum+Math.abs(gaps[id]),0)/60*100)));
  return {match,gaps};
}
