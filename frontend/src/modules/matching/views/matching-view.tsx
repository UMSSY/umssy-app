'use client';

import { useMemo, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeading } from '@/shared/components/layout';
import { ConfirmActionDialog } from '@/shared/components/confirm-action-dialog';
import { AffinityRadarAxisTick, AffinityRadarDot } from '@/modules/radar-chart';
import { RadarAreaDetailsDialog, EMPTY_AREA_EVIDENCE } from '@/modules/radar-chart/integration';
import { RADAR_AXES, radarIntegrationApi, type RealVacancy, type CandidateRow, type AxisId } from '@/modules/radar-chart/integration';
import { useRecruiterVacancies, useRecruiterApplicants, useRecruiterAreaEvidence, useRecruiterDecision } from '@/modules/radar-chart/integration';

const LOCALE='es-BO';
function formatGap(n:number){return `${n>=0?'+':''}${n.toLocaleString(LOCALE,{minimumFractionDigits:1,maximumFractionDigits:1})}`;}
export function MatchingView(){
  const vacanciesQuery=useRecruiterVacancies();
  const vacancies=vacanciesQuery.data??[];
  const [vacancyId,setVacancyId]=useState('');
  const currentVacancyId=vacancyId||vacancies[0]?.id||'';
  const applicantsQuery=useRecruiterApplicants(currentVacancyId);
  const data=applicantsQuery.data??null;
  const decisionMutation=useRecruiterDecision();
  const busy=decisionMutation.isPending;
  const loading=vacanciesQuery.isLoading||applicantsQuery.isLoading;
  const [vacancyOpen,setVacancyOpen]=useState(false);
  const [vacancySearch,setVacancySearch]=useState('');
  const [search,setSearch]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [selectedArea,setSelectedArea]=useState<AxisId|null>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [confirmation,setConfirmation]=useState<{candidate:CandidateRow;action:'hired'|'rejected'}|null>(null);
  const [localError,setLocalError]=useState('');
  const error=localError||(vacanciesQuery.isError?'No se pudo consultar las vacantes autorizadas.':applicantsQuery.isError?'No se pudo consultar los postulantes. Reintenta.':'');
  const loadVacancies=async()=>{await vacanciesQuery.refetch();};
  const loadCandidates=async()=>{await applicantsQuery.refetch();};
  const available=vacancies.filter(v=>v.title.toLocaleLowerCase().includes(vacancySearch.toLocaleLowerCase()));
  const candidates=useMemo(()=>data?.applicants.filter(c=>`${c.name} ${c.headline}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))??[],[data,search]);
  const selected=candidates.find(c=>c.applicationId===selectedId)??candidates[0]??null;
  const applicationId=selected?.applicationId??'';
  const detailQuery=useRecruiterAreaEvidence(applicationId,selectedArea);
  const detail=selectedArea&&detailQuery.data?{applicationId,areaId:selectedArea,evidence:detailQuery.data,error:''}:
    selectedArea&&detailQuery.isError?{applicationId,areaId:selectedArea,evidence:EMPTY_AREA_EVIDENCE,error:'No se pudieron cargar las evidencias autorizadas de esta área.'}:null;
  const target=data?.vacancy.target;
  const graph=RADAR_AXES.map(a=>({axis:a.name,id:a.id,postulante:selected?.scores?.[a.id]??0,objetivo:target?.[a.id]??0}));
  function openArea(area:AxisId){setSelectedArea(area);}
  function chooseVacancy(v:RealVacancy){setVacancyId(v.id);setSelectedId('');setSelectedArea(null);setShowProfile(false);setVacancyOpen(false);setVacancySearch('');setSearch('');}
  async function decision(c:CandidateRow,action:'hired'|'rejected',confirmed=false){if(busy)return;if(!confirmed){setConfirmation({candidate:c,action});return;}try{await decisionMutation.mutateAsync({id:c.applicationId,decision:action});await loadCandidates();setLocalError('');}catch{setLocalError('No se pudo registrar la decisión.');}}
  async function viewCV(c:CandidateRow){try{const blob=await radarIntegrationApi.recruiterCv(c.applicationId);const u=URL.createObjectURL(blob);window.open(u,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(u),60000);}catch{setLocalError('El archivo no existe o el postulante no autorizó su consulta.');}}
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
    <PageHeading title="Postulantes por vacante" description="Radares publicados y postulaciones reales. La compatibilidad es orientativa; no constituye una decisión de contratación automática." />
    <ConfirmActionDialog open={confirmation!==null} title="Confirmar decisión" busy={busy}
      description={`¿${confirmation?.action==='hired'?'Contratar':'Rechazar'} a ${confirmation?.candidate.name??'este candidato'}?`}
      onOpenChange={open=>{if(!open)setConfirmation(null)}}
      onConfirm={()=>{const pending=confirmation;setConfirmation(null);if(pending)void decision(pending.candidate,pending.action,true);}} />
    <section className="relative z-20 rounded-lg border border-border bg-surface p-4">
      <div className="relative max-w-sm">
        <label htmlFor="radar-vacancy-search" className="mb-2 block text-sm font-semibold">Buscar vacante activa</label>
        <Input id="radar-vacancy-search" role="combobox" aria-expanded={vacancyOpen} aria-controls="radar-vacancy-options" placeholder="Buscar vacante" value={vacancyOpen?vacancySearch:vacancies.find(v=>v.id===currentVacancyId)?.title??''} onChange={e=>{setVacancySearch(e.target.value);setVacancyOpen(true);}} onFocus={()=>setVacancyOpen(true)} onKeyDown={e=>{if(e.key==='Escape')setVacancyOpen(false)}} />
        {vacancyOpen&&<div id="radar-vacancy-options" role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-[230px] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl">
          {available.map(v=><Button key={v.id} role="option" aria-selected={v.id===currentVacancyId} variant="ghost" className="h-auto w-full justify-start text-left whitespace-normal" onClick={()=>chooseVacancy(v)}>{v.title}</Button>)}
          {!available.length&&<p className="p-3 text-sm text-text-secondary">No se encontró vacante</p>}
        </div>}
      </div>
    </section>
    {error&&<div role="alert" className="rounded-lg border border-border p-3 text-destructive">{error} <Button variant="outline" onClick={()=>{void loadVacancies();void loadCandidates();}}>Reintentar</Button></div>}
    {loading&&<p role="status">Cargando datos reales…</p>}
    {!vacancies.length&&!loading&&<p className="rounded-lg border border-border p-5">No tienes vacantes activas vinculadas a tu empresa. Un administrador debe asociar tu cuenta a la empresa correspondiente.</p>}
    <div className="grid min-h-[540px] gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">Postulantes · {data?.vacancy.title??'Sin selección'}</h2>
        <Input type="search" aria-label="Buscar postulante" placeholder="Buscar postulante" value={search} onChange={e=>{setSearch(e.target.value);setSelectedArea(null);}} />
        <p className="my-3 text-xs text-text-secondary">{candidates.length} candidato(s) · ordenados por compatibilidad publicada</p>
        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
          {candidates.map(c=><Button key={c.applicationId} variant="outline" onClick={()=>{setSelectedId(c.applicationId);setSelectedArea(null);setShowProfile(false)}} className={`h-auto w-full flex-col items-stretch gap-1 p-3 text-left whitespace-normal ${selected?.applicationId===c.applicationId?'border-accent bg-surface-soft':''}`}>
            <span className="flex justify-between gap-2"><strong>{c.name}</strong><strong>{c.comparison?`${c.comparison.match}%`:'Sin radar'}</strong></span>
            <span className="text-xs text-text-secondary">{c.headline}</span>
            {c.comparison&&<span className="h-1.5 rounded-full bg-border"><span className="block h-full rounded-full bg-accent" style={{width:`${c.comparison.match}%`}} /></span>}
            <span className="text-xs">{c.skills.slice(0,3).join(' · ')||'Sin habilidades aprobadas'}</span>
          </Button>)}
          {!candidates.length&&<p className="p-5 text-sm text-text-secondary">No se encontraron candidatos.</p>}
        </div>
      </section>
      <section className="min-w-0 rounded-lg border border-border bg-surface p-5">
        {!selected?<p className="text-text-secondary">Selecciona un postulante para ver el radar comparativo.</p>:<>
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div><h2 className="text-lg font-bold">{selected.name}</h2><p className="text-sm text-text-secondary">{selected.headline}</p><p className="mt-2 text-xs text-text-secondary">Postulación: {new Date(selected.appliedAt).toLocaleDateString(LOCALE)} · {selected.email?`${selected.phone??'Sin teléfono'} · ${selected.email}`:'Contacto no compartido'}</p></div>
            <div className="ml-auto max-w-48 shrink-0 text-right"><span className="block text-[10px] leading-tight text-text-secondary uppercase">Compatibilidad vs. {data?.vacancy.title}</span><p className="mt-1 text-3xl font-bold text-ink tabular-nums">{selected.comparison?`${selected.comparison.match}%`:'N/D'}</p></div></header>
          {!selected.scores?<p className="my-10 rounded-lg bg-surface-soft p-6 text-center">Este postulante todavía no tiene un radar publicado. No se le asignó compatibilidad ficticia.</p>:<>
            <div className="mt-4 h-[340px] w-full"><ResponsiveContainer width="100%" height="100%"><RadarChart data={graph} outerRadius="65%" accessibilityLayer={false}>
              <PolarGrid stroke="var(--color-border)" /><PolarAngleAxis dataKey="axis" tick={({x,y,index,textAnchor})=>{const a=RADAR_AXES[index];return a?<AffinityRadarAxisTick
                  area={{id:a.id,name:a.name,score:selected.scores?.[a.id]??0}} x={x} y={y}
                  textAnchor={textAnchor} onAreaClick={areaId=>openArea(areaId as AxisId)}/>:<g/>}}/><PolarRadiusAxis domain={[0,10]} angle={90} tickCount={6}/>
              <Radar name="Vacante" dataKey="objetivo" stroke="var(--color-ink-soft)" fill="none" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} dot={false}/>
              <Radar name="Postulante" dataKey="postulante" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.13} strokeWidth={2} isAnimationActive={false}
                dot={({cx,cy,index})=>{const axis=RADAR_AXES[index];return axis?<AffinityRadarDot
                  key={axis.id} area={{id:axis.id,name:axis.name,score:selected.scores?.[axis.id]??0}}
                  cx={cx} cy={cy} onAreaClick={areaId=>openArea(areaId as AxisId)}/>:<g/>}}/>
            </RadarChart></ResponsiveContainer></div>
            <p className="text-center text-xs text-text-secondary">— Perfil objetivo (línea discontinua) · <span className="text-accent">● Postulante</span>. Selecciona un eje o punto para ver evidencias.</p>
            {selectedArea&&<RadarAreaDetailsDialog
              areaName={RADAR_AXES.find(a=>a.id===selectedArea)?.name??selectedArea}
              position={[...RADAR_AXES].sort((a,b)=>(selected.scores?.[b.id]??0)-(selected.scores?.[a.id]??0)||a.name.localeCompare(b.name)).findIndex(a=>a.id===selectedArea)+1}
              score={selected.scores[selectedArea]}
              globalAverage={selected.average??0}
              evidence={detail?.applicationId===applicationId&&detail.areaId===selectedArea?detail.evidence:EMPTY_AREA_EVIDENCE} loading={detailQuery.isLoading} error={detail?.applicationId===applicationId&&detail.areaId===selectedArea?detail.error:''}
              onRetry={()=>{void detailQuery.refetch();}} onClose={()=>setSelectedArea(null)}
              subtitle={`Información relevante del candidato seleccionado: ${selected.name}`}
            />}
            <h3 className="mt-6 font-semibold">Brecha por área</h3>
            <p className="text-xs text-text-secondary">Puntaje del candidato menos objetivo (escala 0–10)</p>
            <ul className="mt-3 space-y-2">{RADAR_AXES.map(a=>{const n=selected.comparison?.gaps[a.id]??0;return <li key={a.id} className="grid grid-cols-[112px_1fr_46px] items-center gap-3 text-xs"><span>{a.name}</span><span className="h-1.5 rounded-full bg-border"><span className={`block h-full rounded-full bg-accent`} style={{width:`${Math.abs(n)*10}%`}}/></span><span className="text-ink">{formatGap(n)}</span></li>})}</ul>
          </>}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4"><Button variant="outline" onClick={()=>setShowProfile(!showProfile)}>Ver perfil</Button><Button disabled={busy||!['applied','interview'].includes(selected.state)} onClick={()=>void decision(selected,'hired')}>Contratar</Button><Button variant="destructive" disabled={busy||!['applied','interview'].includes(selected.state)} onClick={()=>void decision(selected,'rejected')}>Rechazar</Button></div>
          {showProfile&&<div className="mt-3 rounded-lg border border-border bg-surface-soft p-4 text-sm"><h3 className="font-semibold">Perfil compartido por el postulante</h3><p>{selected.headline||'Sin presentación registrada'}</p><p className="mt-2">{selected.email?`${selected.email} · ${selected.phone??'Sin teléfono'}`:'El postulante no autorizó compartir sus datos de contacto'}</p><p className="mt-2">Tecnologías aprobadas: {selected.skills.join(', ')||'Ninguna'}</p>{selected.canViewCv?<Button variant="outline" className="mt-3" onClick={()=>void viewCV(selected)}>Abrir CV autorizado</Button>:<p className="mt-2 text-text-secondary">El titular no autorizó compartir el archivo PDF.</p>}</div>}
          {!['applied','interview'].includes(selected.state)&&<p role="status" className="mt-3 text-sm">Decisión registrada: {selected.state==='hired'?'Contratado':selected.state==='rejected'?'Rechazado':selected.state}</p>}
        </>}
      </section>
    </div>
  </main>;
}
