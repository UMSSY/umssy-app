'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeading } from '@/shared/components/layout';
import { RadarAreaDetailsDialog, EMPTY_AREA_EVIDENCE, type AreaEvidenceDetails } from '@/modules/radar-chart/sprint2/radar-area-details-dialog';
import { RADAR_AXES, radarIntegrationApi, type RealVacancy, type RecruiterResponse, type CandidateRow, type AxisId } from '@/modules/radar-chart/sprint2-integration/radar-integration-api';

const LOCALE='es-BO';
function formatGap(n:number){return `${n>=0?'+':''}${n.toLocaleString(LOCALE,{minimumFractionDigits:1,maximumFractionDigits:1})}`;}
export function MatchingView(){
  const [vacancies,setVacancies]=useState<RealVacancy[]>([]);
  const [vacancyId,setVacancyId]=useState<string>('');
  const [vacancyOpen,setVacancyOpen]=useState(false);
  const [vacancySearch,setVacancySearch]=useState('');
  const [search,setSearch]=useState('');
  const [data,setData]=useState<RecruiterResponse|null>(null);
  const [selectedId,setSelectedId]=useState<string>('');
  const [selectedArea,setSelectedArea]=useState<AxisId|null>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [detail,setDetail]=useState<{applicationId:string;areaId:AxisId;evidence:AreaEvidenceDetails;error:string}|null>(null);
  const [detailRevision,setDetailRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const loadVacancies=useCallback(async()=>{try{const v=await radarIntegrationApi.recruiterVacancies();setVacancies(v);setVacancyId(id=>v.some(x=>x.id===id)?id:v[0]?.id??'');setError('');}catch{setError('No se pudo consultar las vacantes autorizadas.');}finally{setLoading(false);}},[]);
  useEffect(()=>{
    let active=true;
    void radarIntegrationApi.recruiterVacancies()
      .then(v=>{if(!active)return;setVacancies(v);setVacancyId(id=>v.some(x=>x.id===id)?id:v[0]?.id??'');setError('');})
      .catch(()=>{if(active)setError('No se pudo consultar las vacantes autorizadas.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  const loadCandidates=useCallback(async()=>{if(!vacancyId){setData(null);return;}setLoading(true);try{const d=await radarIntegrationApi.applicants(vacancyId);setData(d);setSelectedId(id=>d.applicants.some(a=>a.applicationId===id)?id:d.applicants[0]?.applicationId??'');setError('');}catch{setError('No se pudo consultar los postulantes. Reintenta.');}finally{setLoading(false);}},[vacancyId]);
  useEffect(()=>{
    if(!vacancyId)return;
    let active=true;
    void radarIntegrationApi.applicants(vacancyId)
      .then(d=>{if(!active)return;setData(d);setSelectedId(id=>d.applicants.some(a=>a.applicationId===id)?id:d.applicants[0]?.applicationId??'');setError('');})
      .catch(()=>{if(active)setError('No se pudo consultar los postulantes. Reintenta.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[vacancyId]);
  const available=vacancies.filter(v=>v.title.toLocaleLowerCase().includes(vacancySearch.toLocaleLowerCase()));
  const candidates=useMemo(()=>data?.applicants.filter(c=>`${c.name} ${c.headline}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))??[],[data,search]);
  const selected=candidates.find(c=>c.applicationId===selectedId)??candidates[0]??null;
  const applicationId=selected?.applicationId??'';
  useEffect(()=>{
    if(!selectedArea||!applicationId)return;
    let active=true;
    void radarIntegrationApi.applicantAreaEvidence(applicationId,selectedArea)
      .then(result=>{if(active)setDetail({applicationId,areaId:selectedArea,evidence:result,error:''})})
      .catch(()=>{if(active)setDetail({applicationId,areaId:selectedArea,evidence:EMPTY_AREA_EVIDENCE,error:'No se pudieron cargar las evidencias autorizadas de esta área.'})});
    return ()=>{active=false};
  },[applicationId,selectedArea,detailRevision]);
  const target=data?.vacancy.target;
  const graph=RADAR_AXES.map(a=>({axis:a.name,id:a.id,postulante:selected?.scores?.[a.id]??0,objetivo:target?.[a.id]??0}));
  function openArea(area:AxisId){setDetail(null);setSelectedArea(area);}
  function chooseVacancy(v:RealVacancy){setLoading(true);setData(null);setVacancyId(v.id);setSelectedId('');setSelectedArea(null);setShowProfile(false);setVacancyOpen(false);setVacancySearch('');setSearch('');}
  async function decision(c:CandidateRow,action:'hired'|'rejected'){if(busy||!window.confirm(`${action==='hired'?'Contratar':'Rechazar'} a ${c.name}?`))return;setBusy(true);try{await radarIntegrationApi.decide(c.applicationId,action);await loadCandidates();}catch{setError('No se pudo registrar la decisión.');}finally{setBusy(false);}}
  async function viewCV(c:CandidateRow){try{const blob=await radarIntegrationApi.recruiterCv(c.applicationId);const u=URL.createObjectURL(blob);window.open(u,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(u),60000);}catch{setError('El archivo no existe o el postulante no autorizó su consulta.');}}
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
    <PageHeading title="Postulantes por vacante" description="Radares publicados y postulaciones reales. La compatibilidad es orientativa; no constituye una decisión de contratación automática." />
    <section className="relative z-20 rounded-lg border border-border bg-surface p-4">
      <div className="relative max-w-sm">
        <label htmlFor="radar-vacancy-search" className="mb-2 block text-sm font-semibold">Buscar vacante activa</label>
        <Input id="radar-vacancy-search" role="combobox" aria-expanded={vacancyOpen} aria-controls="radar-vacancy-options" placeholder="Buscar vacante" value={vacancyOpen?vacancySearch:vacancies.find(v=>v.id===vacancyId)?.title??''} onChange={e=>{setVacancySearch(e.target.value);setVacancyOpen(true);}} onFocus={()=>setVacancyOpen(true)} onKeyDown={e=>{if(e.key==='Escape')setVacancyOpen(false)}} />
        {vacancyOpen&&<div id="radar-vacancy-options" role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-[230px] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl">
          {available.map(v=><Button key={v.id} role="option" aria-selected={v.id===vacancyId} variant="ghost" className="h-auto w-full justify-start text-left whitespace-normal" onClick={()=>chooseVacancy(v)}>{v.title}</Button>)}
          {!available.length&&<p className="p-3 text-sm text-text-secondary">No se encontró vacante</p>}
        </div>}
      </div>
    </section>
    {error&&<div role="alert" className="rounded-lg border border-red-300 p-3 text-red-700">{error} <Button variant="outline" onClick={()=>{void loadVacancies();void loadCandidates();}}>Reintentar</Button></div>}
    {loading&&<p role="status">Cargando datos reales…</p>}
    {!vacancies.length&&!loading&&<p className="rounded-lg border border-border p-5">No tienes vacantes activas vinculadas a tu empresa. Un administrador debe asociar tu cuenta a la empresa correspondiente.</p>}
    <div className="grid min-h-[540px] gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 font-semibold">Postulantes · {data?.vacancy.title??'Sin selección'}</h2>
        <Input type="search" aria-label="Buscar postulante" placeholder="Buscar postulante" value={search} onChange={e=>{setSearch(e.target.value);setSelectedArea(null);setDetail(null);}} />
        <p className="my-3 text-xs text-text-secondary">{candidates.length} candidato(s) · ordenados por compatibilidad publicada</p>
        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
          {candidates.map(c=><Button key={c.applicationId} variant="outline" onClick={()=>{setSelectedId(c.applicationId);setSelectedArea(null);setShowProfile(false)}} className={`h-auto w-full flex-col items-stretch gap-1 p-3 text-left whitespace-normal ${selected?.applicationId===c.applicationId?'border-accent bg-surface-soft':''}`}>
            <span className="flex justify-between gap-2"><strong>{c.name}</strong><strong>{c.comparison?`${c.comparison.match}%`:'Sin radar'}</strong></span>
            <span className="text-xs text-text-secondary">{c.headline}</span>
            {c.comparison&&<span className="h-1.5 rounded-full bg-border"><span className="block h-full rounded-full bg-blue-700" style={{width:`${c.comparison.match}%`}} /></span>}
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
              <PolarGrid stroke="#dce3e9" /><PolarAngleAxis dataKey="axis" tick={({x,y,index,textAnchor})=>{const a=RADAR_AXES[index];return a?<g role="button" tabIndex={0} onClick={()=>openArea(a.id)} onKeyDown={e=>{if(e.key==='Enter')openArea(a.id)}} className="cursor-pointer"><text x={x} y={y} textAnchor={textAnchor} fontSize="12" fill="#173648" fontWeight={selectedArea===a.id?800:400}>{a.name}</text></g>:<g/>}}/><PolarRadiusAxis domain={[0,10]} angle={90} tickCount={6}/>
              <Radar name="Vacante" dataKey="objetivo" stroke="#334155" fill="none" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} dot={false}/>
              <Radar name="Postulante" dataKey="postulante" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.13} strokeWidth={2} isAnimationActive={false}
                dot={({cx,cy,index})=>{const axis=RADAR_AXES[index];return axis?<g key={axis.id} data-testid={`candidate-radar-dot-${axis.id}`} role="button" tabIndex={0}
                  aria-label={`Ver evidencias de ${axis.name}`} className="cursor-pointer outline-none"
                  onClick={()=>openArea(axis.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openArea(axis.id)}}}>
                    <circle cx={cx} cy={cy} r={16} fill="transparent" pointerEvents="all"/>
                    <circle cx={cx} cy={cy} r={5} fill="var(--color-accent)" stroke="#ffffff" strokeWidth={1.5} pointerEvents="none"/>
                  </g>:<g/>}}/>
            </RadarChart></ResponsiveContainer></div>
            <p className="text-center text-xs text-text-secondary">— Perfil objetivo (línea discontinua) · <span className="text-accent">● Postulante</span>. Selecciona un eje o punto para ver evidencias.</p>
            {selectedArea&&<RadarAreaDetailsDialog
              areaName={RADAR_AXES.find(a=>a.id===selectedArea)?.name??selectedArea}
              position={[...RADAR_AXES].sort((a,b)=>(selected.scores?.[b.id]??0)-(selected.scores?.[a.id]??0)||a.name.localeCompare(b.name)).findIndex(a=>a.id===selectedArea)+1}
              score={selected.scores[selectedArea]}
              globalAverage={RADAR_AXES.reduce((sum,a)=>sum+(selected.scores?.[a.id]??0),0)/6}
              evidence={detail?.applicationId===applicationId&&detail.areaId===selectedArea?detail.evidence:EMPTY_AREA_EVIDENCE} loading={detail?.applicationId!==applicationId||detail.areaId!==selectedArea} error={detail?.applicationId===applicationId&&detail.areaId===selectedArea?detail.error:''}
              onRetry={()=>{setDetail(null);setDetailRevision(n=>n+1);}} onClose={()=>setSelectedArea(null)}
              subtitle={`Información relevante del candidato seleccionado: ${selected.name}`}
            />}
            <h3 className="mt-6 font-semibold">Brecha por área</h3>
            <p className="text-xs text-text-secondary">Puntaje del candidato menos objetivo (escala 0–10)</p>
            <ul className="mt-3 space-y-2">{RADAR_AXES.map(a=>{const n=selected.comparison?.gaps[a.id]??0;const good=n>=0;return <li key={a.id} className="grid grid-cols-[112px_1fr_46px] items-center gap-3 text-xs"><span>{a.name}</span><span className="h-1.5 rounded-full bg-border"><span className={`block h-full rounded-full ${good?'bg-emerald-400':'bg-orange-300'}`} style={{width:`${Math.abs(n)*10}%`}}/></span><span className={good?'text-emerald-700':'text-orange-700'}>{formatGap(n)}</span></li>})}</ul>
          </>}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4"><Button variant="outline" onClick={()=>setShowProfile(!showProfile)}>Ver perfil</Button><Button disabled={busy||selected.state!=='applied'} onClick={()=>void decision(selected,'hired')}>Contratar</Button><Button variant="destructive" disabled={busy||selected.state!=='applied'} onClick={()=>void decision(selected,'rejected')}>Rechazar</Button></div>
          {showProfile&&<div className="mt-3 rounded-lg border border-border bg-surface-soft p-4 text-sm"><h3 className="font-semibold">Perfil compartido por el postulante</h3><p>{selected.headline||'Sin presentación registrada'}</p><p className="mt-2">{selected.email?`${selected.email} · ${selected.phone??'Sin teléfono'}`:'El postulante no autorizó compartir sus datos de contacto'}</p><p className="mt-2">Tecnologías aprobadas: {selected.skills.join(', ')||'Ninguna'}</p>{selected.canViewCv?<Button variant="outline" className="mt-3" onClick={()=>void viewCV(selected)}>Abrir CV autorizado</Button>:<p className="mt-2 text-text-secondary">El titular no autorizó compartir el archivo PDF.</p>}</div>}
          {selected.state!=='applied'&&<p role="status" className="mt-3 text-sm">Decisión registrada: {selected.state==='hired'?'Contratado':selected.state==='rejected'?'Rechazado':selected.state}</p>}
        </>}
      </section>
    </div>
  </main>;
}
