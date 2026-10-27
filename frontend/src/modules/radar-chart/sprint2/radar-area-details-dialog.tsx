'use client';

import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getAreaLevel } from '../utils/get-area-level';

export interface AreaEvidenceDetails {
  education: Array<{id:string;degree:string;institution:string;year:number|null;description?:string|null}>;
  certifications: Array<{id:string;name:string;issuer:string;year:number|null;credentialId?:string|null}>;
  experiences: Array<{id:string;position:string;companyName:string;duration:string;description?:string|null}>;
  tags: string[];
}

export const EMPTY_AREA_EVIDENCE: AreaEvidenceDetails = {
  education: [], certifications: [], experiences: [], tags: [],
};

interface Props {
  areaName: string;
  position: number;
  score: number;
  globalAverage: number;
  evidence: AreaEvidenceDetails;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClose: () => void;
  subtitle?: string;
  footer?: ReactNode;
}

const decimal = (value:number) => value.toLocaleString('es-BO', {minimumFractionDigits:1, maximumFractionDigits:1});
const percent = (value:number) => `${Math.max(0,Math.min(100,value*10))}%`;

export function RadarAreaDetailsDialog({areaName,position,score,globalAverage,evidence,loading=false,error='',onRetry,onClose,subtitle='Información relevante del candidato seleccionado',footer}:Props){
  const gap = score-globalAverage;
  const level = getAreaLevel(score);
  const levelClass = level==='Bajo'?'bg-rose-100 text-rose-800':level==='Medio'?'bg-amber-100 text-amber-800':level==='Alto'?'bg-sky-100 text-sky-800':'bg-emerald-100 text-emerald-800';
  const total = evidence.education.length+evidence.certifications.length;
  return <Dialog open onOpenChange={open=>{if(!open)onClose()}}>
    <DialogContent showCloseButton={false} className="flex max-h-[min(90vh,840px)] w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-t-[3px] border-t-primary p-0 sm:max-w-5xl">
      <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wide text-primary uppercase"><span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white">{position}</span> Área de afinidad</p>
            <DialogTitle className="text-xl font-bold text-ink">{areaName}</DialogTitle>
            <DialogDescription className="mt-1">{subtitle}</DialogDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="Cerrar detalle del área">Cerrar ×</Button>
        </div>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto">
        <div className="grid gap-0 border-b border-border bg-surface-soft sm:grid-cols-3 sm:divide-x sm:divide-border">
          <div className="p-5"><p className="text-[11px] text-text-secondary uppercase">Puntaje</p><p className="mt-1 text-2xl font-bold text-ink tabular-nums">{decimal(score)} <span className="text-xs font-normal">/ 10</span></p>
            <div role="progressbar" aria-label={`Puntaje de ${areaName}`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={score} className="relative mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-primary" style={{width:percent(score)}}/>
              <div className="absolute -top-1 h-4 w-0.5 bg-slate-800" style={{left:percent(globalAverage)}} title={`Media global: ${decimal(globalAverage)}`}/>
            </div>
          </div>
          <div className="p-5"><p className="text-[11px] text-text-secondary uppercase">Nivel</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${levelClass}`}>{level}</span></div>
          <div className="p-5"><p className="text-[11px] text-text-secondary uppercase">Brecha vs. media</p><p className={`mt-1 text-xl font-bold tabular-nums ${gap<0?'text-rose-600':'text-emerald-700'}`}>{gap<0?'↘ ':gap>0?'↗ ':'→ '}{gap>0?'+':''}{decimal(gap)}</p><p className="text-xs text-text-secondary">vs. media global {decimal(globalAverage)}</p></div>
        </div>
        {loading?<p role="status" className="p-5 text-sm text-text-secondary">Consultando evidencias autorizadas…</p>:null}
        {error?<div role="alert" className="m-5 rounded-md border border-red-200 p-3 text-sm text-red-700">{error}{onRetry?<Button className="ml-2" variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>:null}</div>:null}
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <section className="min-w-0 p-5" aria-label="Cursos y certificaciones">
            <h3 className="mb-4 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase"><span>Cursos y certificaciones</span><span className="text-text-secondary">{total}</span></h3>
            {evidence.education.length?<div className="mb-4"><h4 className="mb-2 text-xs font-semibold text-primary">Formación académica y cursos</h4>{evidence.education.map(e=><div key={e.id} className="border-b border-border py-2 text-sm"><div className="flex justify-between gap-2"><strong className="text-ink">{e.degree}</strong><span className="shrink-0 text-xs text-text-secondary">{e.year??'—'}</span></div><p className="text-xs text-text-secondary">{e.institution}</p>{e.description?<p className="mt-1 text-xs text-text-secondary">{e.description}</p>:null}</div>)}</div>:null}
            {evidence.certifications.length?<div><h4 className="mb-2 text-xs font-semibold text-amber-700">Certificaciones</h4>{evidence.certifications.map(c=><article key={c.id} className="mb-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm"><strong>{c.name}</strong><p className="text-xs text-text-secondary">{c.issuer} · {c.year??'—'}</p>{c.credentialId?<p className="mt-1 font-mono text-[11px] break-all">ID {c.credentialId}</p>:null}</article>)}</div>:null}
            {!total&&!loading?<p className="text-sm text-text-secondary">No se encontraron cursos o certificaciones.</p>:null}
          </section>
          <section className="min-w-0 p-5" aria-label="Experiencia">
            <h3 className="mb-4 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase"><span>Experiencia</span><span className="text-text-secondary">{evidence.experiences.length}</span></h3>
            {evidence.experiences.map(e=><article key={e.id} className="mb-4 border-b border-border pb-3 text-sm"><div className="flex items-start gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"/><div><strong>{e.position}</strong><p className="mt-1 text-xs text-text-secondary">{e.companyName} · {e.duration}</p>{e.description?<p className="mt-2 text-xs text-text-secondary">{e.description}</p>:null}</div></div></article>)}
            {!evidence.experiences.length&&!loading?<p className="text-sm text-text-secondary">No se encontró evidencia documentada.</p>:null}
          </section>
          <section className="min-w-0 p-5" aria-label="Otras habilidades verificadas">
            <h3 className="mb-4 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase"><span>Otros</span><span className="text-text-secondary">{evidence.tags.length}</span></h3>
            {evidence.tags.length?<div className="flex flex-wrap gap-2">{evidence.tags.map(s=><span key={s} className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-ink">{s}</span>)}</div>:!loading?<p className="text-sm text-text-secondary">No se encontró evidencia documentada.</p>:null}
            {footer?<div className="mt-4">{footer}</div>:null}
          </section>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
