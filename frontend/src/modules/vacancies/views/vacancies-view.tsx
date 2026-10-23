"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { vacancies } from "../data/vacancies";
import { VacancyDetailDialog } from "../components/vacancy-detail-dialog";
import type { VacanciesViewProps } from "../types/vacancies-view-props.types";
import { ArrowRight, BriefcaseBusiness, MapPin, Search, SearchX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/shared/components/layout";
import { getInitials } from "@/shared/utils/get-initials";
import { useVacancies } from "../hooks/use-vacancies";

export function VacanciesView({ initialVacancyId, onInitialClose }: VacanciesViewProps = {}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialVacancyId ?? null);
  function openVacancy(event: MouseEvent<HTMLAnchorElement>, id: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setSelectedId(String(id));
  }
  function closeVacancy() {
    setSelectedId(null);
    onInitialClose?.();
  }
  const { search, setSearch, filteredVacancies } = useVacancies();

  return (
    <main className="mx-auto w-full max-w-browse space-y-8">
      <PageHeading
        title="Vacantes"
        description="Encuentra oportunidades laborales para egresados."
      />

      <section aria-label="Buscar vacantes" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="relative w-full max-w-xl">
          <Search aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-text-secondary" />
          <Input
            type="search"
            aria-label="Buscar vacantes por cargo, empresa o requisito"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cargo, empresa o requisito"
            className="pl-10"
          />
        </div>
        <p role="status" className="text-sm text-text-secondary tabular-nums">
          {filteredVacancies.length}{" "}
          {filteredVacancies.length === 1 ? "vacante encontrada" : "vacantes encontradas"}
        </p>
      </section>

      {filteredVacancies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="size-8 text-ink-soft" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-ink">No se encontraron vacantes</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Prueba con otro cargo, empresa o requisito para ampliar tu búsqueda.
          </p>
          {search ? (
            <Button variant="outline" onClick={() => setSearch("")} className="mt-2">
              Limpiar búsqueda
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVacancies.map((vacancy) => (
            <article key={vacancy.id} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-5 rounded-lg border border-border bg-surface-soft/50 p-6 transition-colors hover:border-availability-border hover:bg-availability/30">
              <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-lg bg-accent text-base font-bold text-surface">{getInitials(vacancy.empresa)}</div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink"><Link href={`/vacancies/${vacancy.id}`} onClick={(event) => openVacancy(event, vacancy.id)} className="underline-offset-4 hover:text-accent hover:underline">{vacancy.cargo}</Link></h2>
                <p className="mt-1 text-sm font-medium text-ink-soft">{vacancy.empresa}</p>
                <p className="mt-2 line-clamp-2 max-w-prose text-sm leading-relaxed text-text-secondary">{vacancy.descripcion}</p>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div><dt className="sr-only">Salario</dt><dd className="rounded-md bg-interaction px-2.5 py-1 font-semibold text-accent tabular-nums">{vacancy.salario}</dd></div>
                  <div><dt className="sr-only">Ubicación</dt><dd className="flex items-center gap-1.5 text-ink-soft"><MapPin aria-hidden="true" className="size-4" />{vacancy.ubicacion}</dd></div>
                  <div><dt className="sr-only">Contrato</dt><dd className="flex items-center gap-1.5 text-ink-soft"><BriefcaseBusiness aria-hidden="true" className="size-4" />{vacancy.tipoContrato}</dd></div>
                  <div><dt className="sr-only">Jornada</dt><dd className="text-ink-soft">{vacancy.jornada}</dd></div>
                </dl>
              </div>
              <Link href={`/vacancies/${vacancy.id}`} onClick={(event) => openVacancy(event, vacancy.id)} className={buttonVariants({ variant: "ghost", className: "self-center text-accent hover:text-accent" })} aria-label={`Ver detalles de ${vacancy.cargo}`}>Ver detalles<ArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" /></Link>
            </article>
          ))}
        </div>
      )}

      {selectedId !== null ? <VacancyDetailDialog vacancy={vacancies.find((item) => String(item.id) === selectedId) ?? null} onClose={closeVacancy} /> : null}
    </main>
  );
}
