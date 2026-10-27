'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import { certificationsService } from '@/modules/certifications/services/certifications.service';
import type { AreaId } from '../types/area-detail.types';
import { RADAR_AXIS_NAMES, type RadarBridgeView } from './types';
import { RadarAreaDetailsDialog, type AreaEvidenceDetails } from './radar-area-details-dialog';

interface Props {radar:RadarBridgeView;selected:AreaId;onClose:()=>void}
interface Experience {id:string;position:string;companyName:string;startDate:string;endDate:string|null;description:string|null}
interface Education {id:string;institution:string;degree:string;startDate:string;endDate:string|null;description:string|null}
interface Certification {id:string;name:string;issuingOrganization:string;issueDate:string;hasDocument:boolean}
interface Documents {experiences:Experience[];educations:Education[];certifications:Certification[]}
const empty:Documents={experiences:[],educations:[],certifications:[]};
const year=(s:string)=>{const n=Number(s?.slice(0,4));return Number.isFinite(n)&&n>0?n:null};
const duration=(start:string,end:string|null)=>{
  const a=new Date(start).getTime();const b=end?new Date(end).getTime():Date.now();
  if(!Number.isFinite(a)||!Number.isFinite(b))return 'Duración no disponible';
  const months=Math.max(0,Math.round((b-a)/(1000*60*60*24*30.4375)));
  return months>=12?`${(months/12).toLocaleString('es-BO',{maximumFractionDigits:1})} año(s)`:`${months} mes(es)`;
};
export function RadarEvidencePanel({radar,selected,onClose}:Props){
  const [documents,setDocuments]=useState<Documents>(empty);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let mounted=true;
    async function load(){
      setLoading(true);setError('');
      const results=await Promise.allSettled([
        apiClient.get<ApiResponse<Experience[]>>('/work-experiences'),
        apiClient.get<ApiResponse<Education[]>>('/educations'),
        apiClient.get<ApiResponse<Certification[]>>('/certifications'),
      ]);
      if(!mounted)return;
      const list=<T,>(r:PromiseSettledResult<{data:ApiResponse<T[]>}>):T[]=>r.status==='fulfilled'&&Array.isArray(r.value.data.data)?r.value.data.data:[];
      setDocuments({experiences:list(results[0]),educations:list(results[1]),certifications:list(results[2])});
      if(results.some(r=>r.status==='rejected'))setError('Algunos documentos no pudieron consultarse.');
      setLoading(false);
    }
    void load();return()=>{mounted=false};
  },[radar.userId,radar.version,revision]);
  const relevant=radar.approved.filter(s=>s.areaId===selected);
  const refs=useMemo(()=>new Set(relevant.flatMap(s=>s.evidenceRefs.map(r=>`${r.type}:${r.id}`))),[relevant]);
  const cvRefs=[...refs].filter(r=>r.startsWith('cv:')).map(r=>r.slice(3));
  const evidence:AreaEvidenceDetails={
    education:documents.educations.filter(e=>refs.has(`education:${e.id}`)).map(e=>({id:e.id,degree:e.degree,institution:e.institution,year:year(e.startDate),description:e.description})),
    certifications:documents.certifications.filter(c=>refs.has(`certification:${c.id}`)).map(c=>({id:c.id,name:c.name,issuer:c.issuingOrganization,year:year(c.issueDate)})),
    experiences:documents.experiences.filter(e=>refs.has(`work-experience:${e.id}`)).map(e=>({id:e.id,position:e.position,companyName:e.companyName,duration:duration(e.startDate,e.endDate),description:e.description})),
    tags:[...new Set(relevant.map(s=>s.name))],
  };
  const score=radar.areas.find(a=>a.id===selected)?.score??0;
  const ranking=[...radar.areas].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  const position=ranking.findIndex(a=>a.id===selected)+1;
  const label=RADAR_AXIS_NAMES.find(a=>a.id===selected)?.name??selected;
  async function openDocument(id:string,kind:'cv'|'certification'){
    // Open synchronously so browsers do not block a window after the HTTP request.
    const target=window.open('about:blank','_blank');
    if(target)target.opener=null;
    try{
      const blob=kind==='cv'
        ?(await apiClient.get<Blob>(`/profile/me/cvs/${id}/file`,{responseType:'blob'})).data
        :await certificationsService.getDocument(id);
      if(!blob)throw new Error('Documento no disponible');
      const url=URL.createObjectURL(blob);
      if(target)target.location.href=url;
      else {const link=document.createElement('a');link.href=url;link.download=kind==='cv'?'curriculum.pdf':'respaldo';link.click();}
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch{target?.close();setError('No se pudo abrir el documento relacionado.');}
  }
  const attachments=documents.certifications.filter(c=>c.hasDocument&&refs.has(`certification:${c.id}`));
  return <RadarAreaDetailsDialog areaName={label} position={position} score={score} globalAverage={radar.average} evidence={evidence} loading={loading} error={error} onRetry={()=>setRevision(n=>n+1)} onClose={onClose} subtitle="Información aprobada asociada a la puntuación publicada" footer={<div className="flex flex-col gap-2">{cvRefs.map(id=><Button key={id} variant="outline" size="sm" onClick={()=>void openDocument(id,'cv')}>Abrir CV relacionado</Button>)}{attachments.map(c=><Button key={c.id} variant="outline" size="sm" onClick={()=>void openDocument(c.id,'certification')}>Abrir respaldo de {c.name}</Button>)}</div>}/>;
}
