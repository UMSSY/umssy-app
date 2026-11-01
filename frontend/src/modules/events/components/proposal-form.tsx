'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/shared/components/date-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROPOSAL_DESCRIPTION_LIMIT, PROPOSAL_TITLE_LIMIT, PROPOSAL_LOCATION_LIMIT } from '../constants/proposal.constants';
import { useProposalForm } from '../hooks/use-proposal-form';
import { formatProposalDuration } from '../utils/proposal-format';
import { ProposalField } from './proposal-field';
import { ProposalTimeField } from './proposal-time-field';
import { ProposalCoverField } from './proposal-cover-field';
import { ProposalReviewDialog } from './proposal-review-dialog';

export function ProposalForm() {
  const state = useProposalForm();
  const router = useRouter();
  useEffect(() => { if (state.created) router.push(`/events?proposal=${encodeURIComponent(state.created.id)}`); }, [state.created, router]);
  const form = useRef<HTMLFormElement>(null);
  const { values, errors, change, categories, tutor, profile } = state;
  useEffect(() => {
    if (state.message && !state.reviewing) {
      const frame = requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [state.message, state.reviewing]);
  const duration = formatProposalDuration(values.startTime, values.endTime);
  
  const feedback = (key: keyof typeof values) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `proposal-${key}-error` : undefined,
  });

  const limitMessage = (current: number, max: number) => {
    return current === max ? <span className="ml-2 text-xs font-medium text-notice-foreground">Límite alcanzado</span> : null;
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };

  return (
    <>
      {state.created && <div role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">Tu propuesta se registró correctamente y quedó en votación.</div>}
      
      <form ref={form} noValidate aria-label="Proponer taller" aria-busy={state.pending || state.restoring} className="space-y-6 rounded-lg border border-border bg-surface p-5 sm:p-8 [&_[data-slot=select-trigger]:focus]:bg-availability/40 [&_input:not([readonly]):focus]:bg-availability/40 [&_textarea:focus]:bg-availability/40"
        onBlurCapture={(event) => {
          const field = event.target.closest<HTMLElement>('[data-proposal-field]');
          if (field && !field.contains(event.relatedTarget as Node | null)) state.touch(field.dataset.proposalField!);
        }}
        onSubmit={(event) => { event.preventDefault(); if (!state.review()) requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); }}>
        
        <div className="text-left text-xs text-text-secondary">
          <span className="text-ink">*</span> Campo obligatorio
        </div>
        
        {state.draftWarning && <p role="alert" className="text-sm text-danger">{state.draftWarning}</p>}
        
        <fieldset disabled={state.pending || state.restoring} className="min-w-0 space-y-6">
          <legend className="sr-only">Información de la propuesta</legend>
          
          <ProposalField id="proposal-title" label="Título del taller" error={errors.title}>
            <div className="relative">
              <Input id="proposal-title" name="title" spellCheck lang="es" required maxLength={PROPOSAL_TITLE_LIMIT} value={values.title} onChange={(event) => change('title', event.target.value)} placeholder="Ej. Introducción a Python" className="h-11 pr-16" {...feedback('title')} aria-describedby={`proposal-title-count${errors.title ? ' proposal-title-error' : ''}`} />
              <span id="proposal-title-count" className="pointer-events-none absolute right-3 bottom-2 flex items-center text-xs text-text-secondary tabular-nums">
                {values.title.length}/{PROPOSAL_TITLE_LIMIT}
                {limitMessage(values.title.length, PROPOSAL_TITLE_LIMIT)}
              </span>
            </div>
          </ProposalField>
          
          <ProposalField id="proposal-description" label="Descripción" error={errors.description}>
            <div className="relative">
              <Textarea id="proposal-description" name="description" spellCheck lang="es" required maxLength={PROPOSAL_DESCRIPTION_LIMIT} value={values.description} onChange={(event) => change('description', event.target.value)} placeholder="Describe los objetivos y el contenido del taller…" rows={4} className="field-sizing-fixed resize-y pb-8" {...feedback('description')} aria-describedby={`proposal-description-count${errors.description ? ' proposal-description-error' : ''}`} />
              <span id="proposal-description-count" className="pointer-events-none absolute right-4 bottom-2 flex items-center text-xs text-text-secondary tabular-nums">
                {values.description.length}/{PROPOSAL_DESCRIPTION_LIMIT}
                {limitMessage(values.description.length, PROPOSAL_DESCRIPTION_LIMIT)}
              </span>
            </div>
          </ProposalField>
          
          <ProposalCoverField value={state.cover} onChange={state.changeCover} error={errors.cover} disabled={state.pending} onBusyChange={state.setCoverBusy} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <ProposalField id="proposal-categoryId" label="Categoría" error={errors.categoryId}>
              <Select value={values.categoryId || null} items={categories.categories.map(({ id, name }) => ({ value: id, label: name }))} onValueChange={(value) => change('categoryId', value ?? '')} disabled={categories.isLoading || Boolean(categories.error) || state.pending}>
                <SelectTrigger id="proposal-categoryId" className="h-11 w-full" aria-required="true" {...feedback('categoryId')}><SelectValue placeholder={categories.isLoading ? 'Cargando categorías…' : 'Selecciona una categoría'} /></SelectTrigger>
                <SelectContent>{categories.categories.map(({ id, name }) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent>
              </Select>
              {categories.error && <div role="alert" className="text-sm text-danger">{categories.error} <Button type="button" variant="link" onClick={categories.retry}>Reintentar categorías</Button></div>}
              {!categories.isLoading && !categories.error && !categories.categories.length && <p role="status" className="text-sm text-text-secondary">No hay categorías disponibles para proponer un taller.</p>}
            </ProposalField>
            
            <ProposalField id="proposal-tutor" label="Tutor" required={false}>
              <div className="relative"><LockKeyhole className="pointer-events-none absolute top-3.5 left-3 size-4 text-text-secondary" aria-hidden="true" />
                <Input id="proposal-tutor" value={tutor} readOnly placeholder={profile.isPending ? 'Cargando tutor…' : 'Nombre no disponible'} className="h-11 bg-surface-soft pl-10" aria-describedby="proposal-tutor-help" />
              </div>
              <p id="proposal-tutor-help" className="text-xs text-text-secondary">Se obtiene de tu sesión actual.</p>
              {(!profile.isPending && !tutor || profile.isError) && <div role="alert" className="text-sm text-danger">No se pudo obtener el tutor. <Button type="button" variant="link" onClick={() => void profile.refetch()}>Reintentar perfil</Button></div>}
            </ProposalField>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <ProposalField id="proposal-eventDate" label="Fecha del taller" error={errors.eventDate}>
              <DateField
                id="proposal-eventDate"
                name="eventDate"
                required
                value={values.eventDate}
                onValueChange={(value) => change('eventDate', value)}
                className="h-11"
                initialMonth={getMinDate()}
                min={getMinDate()}
                max={getMaxDate()}
                {...feedback('eventDate')}
              />
            </ProposalField>
            <ProposalTimeField id="proposal-startTime" endTime={values.endTime} label="Hora de inicio" value={values.startTime} onChange={(value) => change('startTime', value)} error={errors.startTime} disabled={state.pending} />
            <div className="space-y-2"><ProposalTimeField id="proposal-endTime" startTime={values.startTime} label="Hora de finalización" value={values.endTime} onChange={(value) => change('endTime', value)} error={errors.endTime} disabled={state.pending} />
              {duration && <p className="text-xs text-text-secondary">Duración: {duration}</p>}
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ProposalField id="proposal-capacity" label="Cupo del taller" error={errors.capacity}>
              <Input id="proposal-capacity" name="capacity" type="number" min={20} max={60} step={1} required inputMode="numeric" value={values.capacity} onChange={(event) => change('capacity', event.target.value)} placeholder="Ej. 30" className="h-11" {...feedback('capacity')} aria-describedby={`proposal-capacity-help${errors.capacity ? ' proposal-capacity-error' : ''}`} />
              <p id="proposal-capacity-help" className="text-xs text-text-secondary">Cantidad de participantes. Mínimo 20 y máximo 60.</p>
            </ProposalField>
            <fieldset className="min-w-0 space-y-2"><legend className="mb-2 text-sm font-semibold text-ink">Modalidad <span aria-hidden="true">*</span></legend>
              <div className="grid grid-cols-2 gap-2">{(['presencial', 'virtual'] as const).map((modality) => <Button key={modality} type="button" variant={values.modality === modality ? 'default' : 'outline'} aria-pressed={values.modality === modality} className="h-11" onClick={() => change('modality', modality)}>{modality === 'presencial' ? 'Presencial' : 'Virtual'}</Button>)}</div>
              {errors.modality && <p role="alert" className="text-sm text-danger">{errors.modality}</p>}
            </fieldset>
          </div>
          
          <ProposalField id="proposal-location" label={values.modality === 'virtual' ? 'Enlace de la reunión' : 'Ubicación'} error={errors.location}>
            <Input id="proposal-location" name="location" type={values.modality === 'virtual' ? 'url' : 'text'} required maxLength={values.modality === 'presencial' ? PROPOSAL_LOCATION_LIMIT : 2000} value={values.location} onChange={(event) => change('location', event.target.value)} placeholder={values.modality === 'virtual' ? 'https://…' : 'Ej. Edificio de Tecnología, piso 2, laboratorio 1'} className="h-11" {...feedback('location')} aria-describedby={['proposal-location-help', values.modality === 'presencial' && values.location.length >= 130 ? 'proposal-location-count' : '', errors.location ? 'proposal-location-error' : ''].filter(Boolean).join(' ') || undefined} />
            {values.modality === 'presencial' && <div className="flex flex-wrap justify-between gap-2">
              <p id="proposal-location-help" className="text-xs text-text-secondary">Indica el lugar. Si agregas edificio, piso o aula, sepáralos con comas.</p>
              {values.location.length >= 130 && <span id="proposal-location-count" className="ml-auto text-xs text-text-secondary tabular-nums">{values.location.length}/{PROPOSAL_LOCATION_LIMIT}{values.location.length >= PROPOSAL_LOCATION_LIMIT ? ' · Límite alcanzado' : ''}</span>}
            </div>}
            {values.modality === 'virtual' && <p id="proposal-location-help" className="text-xs text-text-secondary">Pega el enlace completo de la reunión, comenzando con https://.</p>}
          </ProposalField>
        </fieldset>
        
        {state.message && !state.reviewing && <p role="alert" className="text-sm text-danger">{state.message}</p>}
        
        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" disabled={state.pending || state.coverBusy || state.unavailable}>
            {state.pending ? 'Enviando...' : 'Revisar propuesta'}
          </Button>
        </div>
      </form>
      
      <ProposalReviewDialog open={state.reviewing} values={values} cover={state.cover} tutor={tutor} category={categories.categories.find(({ id }) => id === values.categoryId)?.name ?? ''}
        pending={state.pending} unavailable={state.unavailable} error={state.message} onClose={state.closeReview} onConfirm={() => void state.confirm()} />
    </>
  );
}