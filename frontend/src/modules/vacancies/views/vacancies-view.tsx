'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, BriefcaseBusiness, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeading } from '@/shared/components/layout';
import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import { radarIntegrationApi, type ApplicationSummary } from '@/modules/radar-chart/sprint2-integration/radar-integration-api';
import type { VacanciesViewProps } from '../types/vacancies-view-props.types';

// La lista proviene de GET /api/job-offers (Épica 4), nunca del array de ejemplos.
interface JobOffer {
  id: string; title: string; description: string; category: string;
  modality: string; contractType: string; status: string;
  positionsAvailable: number; salaryRange: string; languages: string;
  expiresAt: string | null;
  company: {id: string; name: string}; skills: {id: string; name: string}[];
}
const label: Record<ApplicationSummary['state'], string> = {
  applied:'Postulación enviada', hired:'Contratado', rejected:'No seleccionado', withdrawn:'Postulación retirada',
};
export function VacanciesView({initialVacancyId,onInitialClose}:VacanciesViewProps={}) {
  const [items,setItems]=useState<JobOffer[]>([]);
  const [applied,setApplied]=useState<ApplicationSummary[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(initialVacancyId??null);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [radarConsent,setRadarConsent]=useState(false);
  const [contactConsent,setContactConsent]=useState(false);
  const [cvConsent,setCvConsent]=useState(false);
  const reload=useCallback(async()=>{
    setLoading(true);
    try {
      const response=await apiClient.get<ApiResponse<JobOffer[]>>('/job-offers');
      setItems(response.data.data);setError('');
    }catch{setError('No se pudieron cargar las vacantes publicadas desde PostgreSQL.');}
    finally{setLoading(false);}
    try{setApplied(await radarIntegrationApi.applications());}catch{setApplied([]);}
  },[]);
  useEffect(()=>{
    let active=true;
    void apiClient.get<ApiResponse<JobOffer[]>>('/job-offers')
      .then(response=>{if(!active)return;setItems(response.data.data);setError('');})
      .catch(()=>{if(active)setError('No se pudieron cargar las vacantes publicadas desde PostgreSQL.');})
      .finally(()=>{if(active)setLoading(false);});
    void radarIntegrationApi.applications()
      .then(rows=>{if(active)setApplied(rows);})
      .catch(()=>{if(active)setApplied([]);});
    return()=>{active=false;};
  },[]);
  const filtered=useMemo(()=>{
    const term=search.toLocaleLowerCase().trim();
    return items.filter(j=>!term||[j.title,j.company.name,j.description,j.category,j.modality,...j.skills.map(s=>s.name)].join(' ').toLocaleLowerCase().includes(term));
  },[items,search]);
  const selected=items.find(j=>j.id===selectedId);
  const current=applied.find(a=>a.jobOfferId===selectedId);
  const currentStatus=current?.state;
  const canEdit=!current||currentStatus!=='withdrawn';
  const choices={consent:radarConsent,consentCv:radarConsent&&cvConsent,consentContact:radarConsent&&contactConsent};
  function open(id:string){
    const a=applied.find(row=>row.jobOfferId===id);
    setRadarConsent(a?.consent??false);setContactConsent(a?.consentContact??false);setCvConsent(a?.consentCv??false);
    setSelectedId(id);setMessage('');
  }
  function close(){setSelectedId(null);setMessage('');onInitialClose?.();}
  async function apply(){
    if(!selected||busy||!canEdit)return;
    if(!current&&!radarConsent){setMessage('Debes autorizar el uso de tu radar publicado para enviar la postulación.');return;}
    setBusy(true);setMessage('');
    try{
      if(current){await radarIntegrationApi.updateConsents(current.id,choices);setMessage('Permisos actualizados. Puedes revocarlos o retirar tu postulación.');}
      else {await radarIntegrationApi.apply(selected.id,choices);setMessage('Postulación real registrada. La empresa recibirá únicamente los datos autorizados.');}
      setApplied(await radarIntegrationApi.applications());
    }catch{setMessage('No se pudo completar la solicitud. Comprueba tu sesión de titulado y que la vacante continúe publicada.');}
    finally{setBusy(false);}
  }
  async function withdraw(){
    if(!current||current.state!=='applied'||busy)return;
    if(!window.confirm('¿Retirar postulación y revocar todos los permisos de acceso?'))return;
    setBusy(true);
    try{await radarIntegrationApi.withdraw(current.id);setApplied(await radarIntegrationApi.applications());setMessage('Postulación retirada y permisos revocados.');}
    catch{setMessage('No se pudo retirar la postulación.');}
    finally{setBusy(false);}
  }
  return <main className="mx-auto w-full max-w-browse space-y-7">
    <PageHeading title="Vacantes" description="Ofertas publicadas y vigentes. Postula con consentimiento explícito y revisa tus solicitudes." />
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <Search aria-hidden="true" className="size-5 text-text-secondary" />
      <Input type="search" aria-label="Buscar cargo, empresa o tecnología" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cargo, empresa o tecnología" />
      <span role="status" className="shrink-0 text-xs text-text-secondary">{filtered.length} vacante(s)</span>
    </div>
    {error&&<p role="alert" className="rounded-md border border-red-300 p-4 text-sm">{error} <Button variant="outline" onClick={()=>void reload()}>Reintentar</Button></p>}
    {loading?<p role="status">Cargando vacantes reales…</p>:
      filtered.length===0?<p className="rounded-lg border border-border p-8 text-center">No hay vacantes publicadas que coincidan con tu búsqueda.</p>:
      <div className="grid gap-4">{filtered.map(job=>{
        const a=applied.find(row=>row.jobOfferId===job.id);
        return <article key={job.id} className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-5">
          <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{job.title}</h2>
            <p className="text-sm text-text-secondary">{job.company.name} · {job.modality} · {job.contractType} · {job.salaryRange}</p>
            <p className="mt-3 line-clamp-2 text-sm">{job.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">{job.skills.slice(0,6).map(skill=><span key={skill.id} className="rounded bg-interaction px-2 py-1 text-xs">{skill.name}</span>)}</div>
            {a&&<p role="status" className="mt-2 text-sm font-semibold">{label[a.state]}</p>}
          </div>
          <Button type="button" variant="outline" onClick={()=>open(job.id)}><BriefcaseBusiness className="size-4" aria-hidden="true" /> Detalles y postulación <ArrowRight className="size-4" aria-hidden="true" /></Button>
        </article>;
      })}</div>}
    <Dialog open={selectedId!==null} onOpenChange={open=>{if(!open)close();}}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{selected?.title??'Vacante no disponible'}</DialogTitle>
          <DialogDescription>{selected?.company.name??'La oferta no se encuentra entre las vacantes vigentes.'}</DialogDescription></DialogHeader>
        {selected&&<div className="space-y-5 text-sm">
          <p className="whitespace-pre-line">{selected.description}</p>
          <p className="rounded-lg bg-interaction p-3">{selected.modality} · {selected.contractType} · {selected.salaryRange} · {selected.positionsAvailable} puesto(s)</p>
          <section><h3 className="font-semibold">Habilidades requeridas</h3><ul className="flex flex-wrap gap-2 pt-2">{selected.skills.map(skill=><li key={skill.id} className="rounded border px-2 py-1">{skill.name}</li>)}</ul></section>
          {current&&<p role="status" className="rounded bg-surface-soft p-3">Estado de tu postulación: {label[current.state]}</p>}
          {canEdit&&<fieldset className="space-y-4 rounded-lg border border-border p-4"><legend className="px-2 font-semibold">Decisiones de consentimiento</legend>
            <label className="flex items-start gap-3"><Checkbox className="mt-1" checked={radarConsent} onCheckedChange={setRadarConsent} /><span><strong>1. Radar y resumen de habilidades.</strong> Autorizar a la empresa responsable de esta vacante a consultar mis competencias publicadas. Obligatorio para postularme, revocable después.</span></label>
            <label className="flex items-start gap-3"><Checkbox className="mt-1" checked={contactConsent} disabled={!radarConsent} onCheckedChange={setContactConsent} /><span><strong>2. Datos de contacto.</strong> Permitir compartir correo y teléfono (opcional).</span></label>
            <label className="flex items-start gap-3"><Checkbox className="mt-1" checked={cvConsent} disabled={!radarConsent} onCheckedChange={setCvConsent} /><span><strong>3. Archivo CV.</strong> Permitir abrir mi PDF si administración ya lo aprobó (opcional).</span></label>
          </fieldset>}
          {message&&<p role="status" className="rounded bg-surface-soft p-3">{message}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={close}>Cerrar</Button>
            {currentStatus==='applied'&&<Button variant="destructive" disabled={busy} onClick={()=>void withdraw()}>Retirar postulación</Button>}
            {canEdit&&<Button disabled={busy||(!current&&!radarConsent)} onClick={()=>void apply()}>{busy?'Guardando…':current?'Guardar permisos':'Confirmar postulación'}</Button>}
          </div>
        </div>}
      </DialogContent>
    </Dialog>
  </main>;
}
