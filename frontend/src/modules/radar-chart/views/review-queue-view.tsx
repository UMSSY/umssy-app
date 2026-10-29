'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/shared/components/layout';
import { radarIntegrationApi, type ReviewRow } from '../sprint2-integration/radar-integration-api';

export function ReviewQueueView(){
  const [items,setItems]=useState<ReviewRow[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [filter,setFilter]=useState('pending');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const load=useCallback(async()=>{try{setItems(await radarIntegrationApi.reviews());setError('');}catch{setError('No se pudo recuperar la cola de revisión. Comprueba tu sesión administrativa.');}},[]);
  useEffect(()=>{
    let active=true;
    void radarIntegrationApi.reviews()
      .then(rows=>{if(!active)return;setItems(rows);setError('');})
      .catch(()=>{if(active)setError('No se pudo recuperar la cola de revisión. Comprueba tu sesión administrativa.');});
    const t=setInterval(()=>{void load()},5000);
    return()=>{active=false;clearInterval(t);};
  },[load]);
  const shown=useMemo(()=>items.filter(i=>filter==='all'||i.status===filter),[filter,items]);
  const item=shown.find(x=>x.id===selected)??shown[0]??null;
  async function approve(action:'approved'|'rejected'|'revoked'){
    if(!item||busy)return;
    if(!window.confirm(`¿Confirmar ${action==='approved'?'aprobación':action==='rejected'?'rechazo':'revocación'} de ${item.title}?`))return;
    setBusy(true);
    try{const [kind,id]=item.id.split(':');const result=await radarIntegrationApi.decision(kind,id,action);await load();setSelected(null);setNotice(result.processingStatus==='error'?'La decisión se guardó, pero la publicación del radar falló. El titular puede reintentar la actualización desde su radar.':'');}catch{setError('No se pudo guardar la decisión. Reintenta.');}finally{setBusy(false);}
  }
  async function reprocess(){
    if(!item||item.type!=='cv'||busy)return;
    if(!window.confirm('Se volverá a extraer el texto sin modificar la decisión administrativa del CV. ¿Continuar?'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const outcome=await radarIntegrationApi.adminReprocessCv(item.id.slice(3));
      setNotice(outcome.extractionStatus==='ready'
        ?`Texto extraído: ${outcome.extractedCharacters} caracteres. Estado NLP: ${outcome.nlpStatus}. Revisa y aprueba las habilidades detectadas por separado.`
        :`Extracción ${outcome.extractionStatus}. No se inventarán habilidades. Si el PDF está escaneado, sube uno con texto seleccionable.`);
      await load();
    }catch{setError('No fue posible reprocesar el CV. Revisa el backend y los permisos administrativos.');}
    finally{setBusy(false);}
  }
  async function viewPdf(){if(!item||item.type!=='cv')return;try{const pdf=await radarIntegrationApi.adminCv(item.id.slice(3));const url=URL.createObjectURL(pdf);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000);}catch{setError('No fue posible descargar el PDF autorizado.');}}
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
    <PageHeading title="Revisión documental y de radares" description="Documentos y habilidades reales. La aprobación queda registrada y dispara el recálculo persistido." />
    {notice&&<p role="status" className="rounded-lg border border-border bg-surface-soft p-4 text-sm">{notice}</p>}
    {error&&<div role="alert" className="rounded-lg border border-red-200 p-4 text-red-700">{error} <Button variant="outline" onClick={()=>void load()}>Reintentar</Button></div>}
    <div className="flex flex-wrap gap-2">{[['pending','Pendientes'],['approved','Aprobados'],['rejected','Rechazados'],['all','Todos']].map(([id,name])=><Button key={id} variant={filter===id?'default':'outline'} onClick={()=>setFilter(id)}>{name}</Button>)}</div>
    <div className="grid min-h-[500px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <section className="max-h-[70vh] space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3" aria-label="Elementos enviados">
        <p className="text-sm text-text-secondary">{shown.length} elemento(s)</p>
        {shown.map(i=><Button key={i.id} variant="outline" className={`h-auto w-full flex-col items-start py-3 text-left whitespace-normal ${item?.id===i.id?'border-accent':''}`} onClick={()=>setSelected(i.id)}><span className="font-semibold">{i.userName}</span><span className="text-xs">{i.type==='cv'?'CV PDF':'Habilidad'} · {i.title}</span><span className="text-xs text-text-secondary">{i.status} · {new Date(i.date).toLocaleDateString('es-BO')}</span></Button>)}
        {!shown.length&&<p className="p-4 text-sm text-text-secondary">No hay elementos en esta categoría.</p>}
      </section>
      <section className="min-w-0 space-y-4 rounded-lg border border-border bg-surface p-6">
        {item?<><h2 className="text-xl font-semibold">{item.userName}</h2><p><strong>{item.type==='cv'?'Currículum':'Habilidad'}:</strong> {item.title}</p><p className="text-sm">Estado: <strong>{item.status}</strong></p>
          {item.type==='cv'&&<><p className="text-sm">Extracción de texto: {item.extractionStatus==='ready'?`Completada (${item.extractedCharacters??0} caracteres)` : item.extractionStatus==='unreadable'?'Sin texto seleccionable (posible escaneo)':item.extractionStatus==='pending'?'Aún no analizado':'Fallida: requiere reintento'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void viewPdf()}>Visualizar PDF adjunto</Button><Button variant="outline" disabled={busy} onClick={()=>void reprocess()}>Reprocesar texto del PDF</Button></div>{item.extractionStatus!=='ready'&&<p role="note" className="text-xs text-amber-700">El documento puede estar aprobado sin texto extraído, pero no generará competencias verificadas por sí mismo. Aprobar el archivo no equivale a aprobar habilidades.</p>}</>}
          {item.type==='skill'&&<div className="rounded-lg bg-surface-soft p-3 text-sm"><p>Área detectada: {item.areaId??'Sin clasificar'}</p><p className="mt-2 break-words">Referencias de origen: {JSON.stringify(item.evidenceRefs??[])}</p></div>}
          <p className="text-xs text-text-secondary">Aprobar el PDF no verifica automáticamente cada habilidad. Confirma las habilidades detectadas por separado tras revisar su procedencia.</p>
          <div className="flex flex-wrap gap-2"><Button disabled={busy||item.status==='approved'} onClick={()=>void approve('approved')}>Aprobar</Button><Button variant="destructive" disabled={busy||item.status==='rejected'} onClick={()=>void approve('rejected')}>Rechazar</Button>{item.status==='approved'&&<Button variant="outline" disabled={busy} onClick={()=>void approve('revoked')}>Revocar</Button>}</div>
        </>:<p className="text-sm text-text-secondary">Selecciona una evidencia para revisarla.</p>}
      </section>
    </div>
  </main>;
}
