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

export function MyPassesView() {
  const { registrations, isLoading, error, retry } = useMyPasses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = registrations.find((item) => item.id === selectedId) ?? registrations[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading title="Mis inscripciones" description={isLoading ? "Cargando tus inscripciones…" : `${registrations.length} ${registrations.length === 1 ? "inscripción" : "inscripciones"}`} actions={<Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>} />
      {isLoading ? <RequestFeedback message="Cargando tus inscripciones..." /> : error ? <RequestFeedback message={error} isError onRetry={retry} /> : !registrations.length ? <MyPassesEmptyState /> : (
        <div className="grid grid-cols-2 items-start gap-6">
          <section aria-label="Tus inscripciones"><ul className="space-y-3">{registrations.map((item) => <li key={item.id}><PassCard title={item.eventName} date={formatRegistrationDate(item.date)} status={item.status} location={item.location} registrationId={item.id} isSelected={selected?.id === item.id} onClick={() => setSelectedId(item.id)} /></li>)}</ul></section>
          {selected ? <aside aria-label="Detalle de la inscripción" className="sticky top-24 min-w-0"><PassDetail registration={selected} /></aside> : null}
        </div>
      )}
    </main>
  );
}
