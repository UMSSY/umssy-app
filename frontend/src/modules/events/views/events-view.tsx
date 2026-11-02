'use client';

import type { EventsViewProps } from '../types/events-view-props.types';

import { cn } from "@/lib/utils";
import { PageHeading } from "@/shared/components/layout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Button } from '@/components/ui/button';
import { buildLoginUrl } from '@/modules/auth/utils/safe-next-path';
import { useRegistrationSession } from '@/modules/registrations';
import { useAuth } from '@/shared/contexts/auth-context';
import { parseApiError } from '@/shared/utils/parse-api-error';
import { useEffect, useRef, useState } from 'react';
import { RequestFeedback } from '../components/request-feedback';
import { EventDetailState } from '../components/event-detail-state';
import { EventCard } from '../components/event-card';
import { EventDetailPanel } from '../components/event-detail-panel';
import { useEvent } from '../hooks/use-event';
import { useEvents } from '../hooks/use-events';
import { useEventsFilters } from '../hooks/use-events-filters';
import { useProposalSupport } from '../hooks/use-proposal-support';
import { useEventCategories } from '@/modules/event-categories';
import { EventsSearchInput } from '../components/events-search-input';
import { CategoryFilterChips } from '@/modules/event-categories';
import type { EventItem } from '../types/event.types';
import type { EventDetail } from '../types/event-detail.types';
import { getProposalSupportErrorMessage } from '../utils/proposal-support-error';

export function EventsView({ initialProposalId = null }: EventsViewProps) {
  const router = useRouter();
  const session = useRegistrationSession();
  const { roles, isLoading: rolesLoading } = useAuth();
  const { searchInput, setSearchInput, categoryId, setCategoryId, filters } =
    useEventsFilters();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useEventCategories();
  const { events, error, hasMore, isLoading, isLoadingMore, loadMore, retry } =
    useEvents(filters);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialProposalId);
  const viewRef = useRef<HTMLElement>(null);

  const handleSelectEvent = (selectedEvent: EventItem) => {
    setSelectedEventId(selectedEvent.id);
  };

  const detail = useEvent(selectedEventId);
  const support = useProposalSupport(selectedEventId);
  const alreadySupported = support.errorCode === 'ALREADY_SUPPORTED';
  const displayedDetail = alreadySupported && detail.event
    ? { ...detail.event, hasSupported: true }
    : detail.event;
  const supportBlocked = [
    'ALREADY_SUPPORTED', 'PROPOSAL_EXPIRED', 'EVENT_NOT_SUPPORTABLE',
    'FORBIDDEN_ROLE', 'USER_INACTIVE',
  ].includes(support.errorCode ?? '');
  const supportNotice = !session
    ? 'Inicia sesión para apoyar esta propuesta.'
    : rolesLoading
      ? 'Verificando permisos para apoyar...'
      : !roles.includes('titulado')
        ? 'Solo los usuarios con perfil Titulado pueden apoyar propuestas.'
        : null;
  const supportRetryable = !support.errorCode || ['INTERNAL_ERROR', 'VALIDATION_ERROR'].includes(support.errorCode);

  async function handleSupport(event: EventDetail) {
    const returnToProposal = `/events?proposal=${encodeURIComponent(event.id)}`;
    if (!session) {
      router.push(buildLoginUrl(returnToProposal));
      return;
    }
    if (rolesLoading || !roles.includes('titulado') || support.isPending || event.hasSupported || supportBlocked) return;

    const result = await support.support();
    if (!result?.error) return;
    const code = parseApiError(result.error)?.code;
    if (code === 'EVENT_NOT_FOUND') {
      toast.error(getProposalSupportErrorMessage(result.error));
      setSelectedEventId(null);
    } else if (code === 'AUTH_REQUIRED' || code === 'UNAUTHENTICATED') {
      toast.info(getProposalSupportErrorMessage(result.error));
      router.push(buildLoginUrl(returnToProposal));
    }
  }
  const listedEvents = initialProposalId && displayedDetail?.id === initialProposalId && !filters.search.trim() && !filters.categoryId && !events.some((event) => event.id === initialProposalId)
    ? [displayedDetail, ...events] : events;
  const visibleEvents = alreadySupported
    ? listedEvents.map((event) => event.id === selectedEventId ? { ...event, hasSupported: true } : event)
    : listedEvents;

  useEffect(() => {
    if (!selectedEventId) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (document.querySelector('[data-registration-dialog]') || event.target instanceof Element && event.target.closest('[data-registration-dialog]')) return;
      if (event.key === 'Escape') setSelectedEventId(null);
    }
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (document.querySelector('[data-registration-dialog]') || target instanceof Element && target.closest('[data-registration-dialog], [data-slot="dialog-overlay"]')) return;
      if (!(target instanceof Element)) return;
      if (
        viewRef.current?.contains(target) &&
        target.closest('aside, [aria-label="Listado de talleres"] button[aria-pressed]')
      ) return;
      setSelectedEventId(null);
    }
    function handleSearchFocus(event: FocusEvent) {
      if (document.querySelector('[data-registration-dialog]')) return;
      const target = event.target;
      if (target instanceof Element && viewRef.current?.contains(target) && target.matches('input[type="search"]')) {
        setSelectedEventId(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('focusin', handleSearchFocus);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('focusin', handleSearchFocus);
    };
  }, [selectedEventId]);

  return (
    <main ref={viewRef} className="@container/events mx-auto w-full max-w-browse space-y-8">
      <PageHeading title="Talleres y eventos" description={isLoading && !events.length ? "Cargando actividades de la comunidad…" : `${events.length} talleres disponibles`} actions={<Link href="/events/my-passes" className={buttonVariants({ variant: "outline" })}><Ticket aria-hidden="true" />Mis inscripciones</Link>} />
      <div className={cn("grid items-start transition-[grid-template-columns,gap] duration-300 ease-out", selectedEventId ? "grid-cols-1 gap-6 @4xl/events:grid-cols-(--grid-template-columns-event-browser-open)" : "grid-cols-1 gap-0 @4xl/events:grid-cols-(--grid-template-columns-event-browser)")}>
      <div className="min-w-0 space-y-6">
        <div
          role="search"
          aria-label="Filtros de talleres"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <EventsSearchInput value={searchInput} onChange={(value) => {
            setSelectedEventId(null);
            setSearchInput(value);
          }} />
          <CategoryFilterChips
            categories={categories}
            selectedId={categoryId}
            onSelect={(id) => {
              setSelectedEventId(null);
              setCategoryId(id);
            }}
          />
        </div>

        {categoriesLoading && (
          <RequestFeedback message="Cargando categorías..." />
        )}
        {categoriesError && (
          <RequestFeedback
            message={categoriesError}
            isError
            onRetry={retryCategories}
            retryLabel="Reintentar categorías"
          />
        )}

        <section aria-label="Listado de talleres">
          <div className="grid grid-cols-(--grid-template-columns-event-cards) gap-5">
            {visibleEvents.map((eventItem) => (
              <EventCard
                key={eventItem.id}
                event={eventItem}
                isSelected={selectedEventId === eventItem.id}
                onSelect={handleSelectEvent}
              />
            ))}
          </div>
          {isLoading && events.length === 0 && (
            <p role="status" className="py-10 text-center text-text-secondary">
              Cargando talleres...
            </p>
          )}
          {!isLoading && !error && visibleEvents.length === 0 && (
            <p className="py-10 text-center text-text-secondary">
              {filters.search.trim() || filters.categoryId
                ? 'No se encontraron talleres con esos filtros. Prueba otra búsqueda o categoría.'
                : 'No hay talleres disponibles.'}
            </p>
          )}
          {error && <RequestFeedback message={error} isError onRetry={retry} />}
          {hasMore && !error && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más talleres'}
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="order-first min-w-0 @4xl/events:sticky @4xl/events:top-24 @4xl/events:order-none @4xl/events:max-h-event-detail @4xl/events:overflow-x-hidden @4xl/events:overflow-y-auto @4xl/events:overscroll-contain">
      {selectedEventId && (displayedDetail ? (
        <EventDetailPanel
          event={displayedDetail}
          onClose={() => setSelectedEventId(null)}
          onSupport={(event) => { void handleSupport(event); }}
          isSupportPending={support.isPending}
          isSupportDisabled={Boolean(session && (rolesLoading || !roles.includes('titulado'))) || supportBlocked}
          supportNotice={supportNotice}
          supportError={alreadySupported || support.errorCode === 'EVENT_NOT_FOUND' || support.errorCode === 'AUTH_REQUIRED' || support.errorCode === 'UNAUTHENTICATED' ? null : support.error}
          supportSuccessMessage={support.isSuccess && support.data?.status === 'Publicado'
            ? 'La propuesta fue publicada y tu inscripción quedó confirmada. Puedes ver tu pase en Mis inscripciones.'
            : null}
          onRetrySupport={supportRetryable && !support.isPending && !supportBlocked
            ? () => { if (detail.event) void handleSupport(detail.event); }
            : undefined}
        />
      ) : (
        <EventDetailState
          selectedId={selectedEventId}
          isLoading={detail.isLoading}
          error={detail.error}
          notFound={detail.notFound}
          retry={detail.retry}
          onClose={() => setSelectedEventId(null)}
        />
      ))}
      </div>
      </div>
    </main>
  );
}
