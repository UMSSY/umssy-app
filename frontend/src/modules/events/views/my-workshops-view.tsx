'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeading } from '@/shared/components/layout';
import { Button } from '@/components/ui/button';
import { EventsSearchInput } from '../components/events-search-input';
import { ManagedWorkshopCard } from '../components/managed-workshop-card';
import { RequestFeedback } from '../components/request-feedback';
import { useManagedWorkshops } from '../hooks/use-managed-workshops';
import { isManagedWorkshopFinished } from '../utils/managed-workshop-status';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

type Filter = 'active' | 'finished';

export function MyWorkshopsView() {
  const { workshops, isLoading, error, retry } = useManagedWorkshops();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const counts = useMemo(() => ({
    active: workshops.filter((item) => !isManagedWorkshopFinished(item, now)).length,
    finished: workshops.filter((item) => isManagedWorkshopFinished(item, now)).length,
  }), [workshops, now]);
  const visible = workshops.filter((item) => {
    const matchesStatus = isManagedWorkshopFinished(item, now) === (filter === 'finished');
    const matchesSearch = item.title.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'));
    return matchesStatus && matchesSearch;
  });

  function handleRegisterAttendance(_workshop: ManagedWorkshop, finished: boolean) {
    setNotice(finished
      ? 'Fuera de la ventana horaria de validación. El taller ha finalizado.'
      : 'El registro de asistencias estará disponible próximamente.');
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading title="Mis talleres" description="Talleres que organizas o gestionas." />
      <div role="search" aria-label="Filtros de mis talleres" className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <EventsSearchInput value={search} onChange={(value) => { setSearch(value); setNotice(null); }} />
        <div role="group" aria-label="Estado del taller" className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant={filter === 'active' ? 'default' : 'outline'} aria-pressed={filter === 'active'} onClick={() => { setFilter('active'); setNotice(null); }}>Activos ({counts.active})</Button>
          <Button type="button" variant={filter === 'finished' ? 'default' : 'outline'} aria-pressed={filter === 'finished'} onClick={() => { setFilter('finished'); setNotice(null); }}>Finalizados ({counts.finished})</Button>
        </div>
      </div>
      {notice && <RequestFeedback message={notice} />}
      {isLoading ? <RequestFeedback message="Cargando tus talleres..." />
        : error ? <RequestFeedback message={error} isError onRetry={retry} />
          : visible.length ? (
            <section aria-label="Talleres gestionados" className="space-y-4">
              {visible.map((workshop) => <ManagedWorkshopCard key={workshop.id} workshop={workshop} finished={isManagedWorkshopFinished(workshop, now)} onRegisterAttendance={handleRegisterAttendance} />)}
            </section>
          ) : <p className="py-10 text-center text-text-secondary">{search.trim() ? 'No se encontraron talleres con esa búsqueda.' : filter === 'active' ? 'No tienes talleres activos.' : 'No tienes talleres finalizados.'}</p>}
    </main>
  );
}
