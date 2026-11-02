"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { useMyPasses } from "../hooks/use-my-passes";
import { RequestFeedback } from "../components/request-feedback";
import { PassCard } from "../components/pass-card";
import { PassDetail } from "../components/pass-detail";
import { MyPassesEmptyState } from "../components/my-passes-empty-state";
import { formatRegistrationDate } from "../utils/registration-format";

import type { MyPassesViewProps } from "../types/my-passes-view-props.types";

export function MyPassesView({ onOpenWorkshopChat }: MyPassesViewProps = {}) {
  const { registrations, isLoading, error, retry } = useMyPasses();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtrar registros duplicados por nombre de taller y fecha
  const uniqueRegistrations = registrations.reduce((acc: typeof registrations, current) => {
    const isDuplicate = acc.some(
      (item) => item.eventName === current.eventName && item.date === current.date
    );
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  const selected = uniqueRegistrations.find((item) => item.id === selectedId) ?? uniqueRegistrations[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading 
        title="Mis inscripciones" 
        description={isLoading ? "Cargando tus inscripciones…" : `${uniqueRegistrations.length} ${uniqueRegistrations.length === 1 ? "pase" : "pases"}`} 
        actions={<Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>} 
      />
      {isLoading ? (
        <RequestFeedback message="Cargando tus inscripciones..." />
      ) : error ? (
        <RequestFeedback message={error} isError onRetry={retry} />
      ) : !uniqueRegistrations.length ? (
        <MyPassesEmptyState />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section aria-label="Tus inscripciones">
            <ul className="space-y-3">
              {uniqueRegistrations.map((item) => (
                <li key={item.id}>
                  <PassCard 
                    title={item.eventName}
                    date={formatRegistrationDate(item.date)} 
                    startTime={item.startTime}
                    endTime={item.endTime}
                    status={item.status} 
                    location={item.location} 
                    registrationId={item.id} 
                    onOpenChat={onOpenWorkshopChat} 
                    isSelected={selected?.id === item.id} 
                    onClick={() => setSelectedId(item.id)} 
                  />
                </li>
              ))}
            </ul>
          </section>
          {selected ? (
            <aside aria-label="Detalle de la inscripción" className="sticky top-24 min-w-0">
              <PassDetail registration={selected} />
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}