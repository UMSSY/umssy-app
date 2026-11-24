"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { VacancyDetailDialog } from "../components/vacancy-detail-dialog";
import type { VacanciesViewProps } from "../types/vacancies-view-props.types";
import { ArrowRight, BriefcaseBusiness, ExternalLink, Search, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSafeMapsUrl } from "@/modules/job-offers";
import { AppliedJobChip } from "@/modules/matching";
import { ModalityIcon } from "@/shared/components/modality-icon";
import { PageHeading } from "@/shared/components/layout";
import { VacancyDateBadges } from "@/shared/components/vacancy-date-badges";
import { CARD_MOTION_CLASS } from "@/shared/constants/card-motion.constants";
import { VACANCY_CARD_CLASS } from "@/shared/constants/vacancy-card.constants";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { getInitials } from "@/shared/utils/get-initials";
import { useVacancies } from "../hooks/use-vacancies";
import { canApplyToVacancies } from "../utils/can-apply-to-vacancies";

export function VacanciesView({ initialVacancyId, onInitialClose }: VacanciesViewProps = {}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialVacancyId ?? null);
  function openVacancy(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setSelectedId(id);
  }
  function closeVacancy() {
    setSelectedId(null);
    onInitialClose?.();
  }
  const canApply = canApplyToVacancies(getAccessToken());
  const { search, setSearch, vacancies, filteredVacancies, isLoading, isError, retry } = useVacancies();

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
          {isLoading ? "Cargando vacantes…" : `${filteredVacancies.length} ${filteredVacancies.length === 1 ? "vacante encontrada" : "vacantes encontradas"}`}
        </p>
      </section>

      {isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-ink">No pudimos cargar las vacantes</h2>
          <p className="max-w-md text-sm text-text-secondary">Revisa tu conexión e intenta nuevamente.</p>
          <Button variant="outline" onClick={() => retry()} className="mt-2">Reintentar</Button>
        </div>
      ) : isLoading ? null : filteredVacancies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="size-8 text-ink-soft" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-ink">{search ? "No se encontraron vacantes" : "Todavía no hay vacantes publicadas"}</h2>
          <p className="max-w-md text-sm text-text-secondary">
            {search ? "Prueba con otro cargo, empresa o requisito para ampliar tu búsqueda." : "Vuelve pronto para ver nuevas oportunidades."}
          </p>
          {search ? (
            <Button variant="outline" onClick={() => setSearch("")} className="mt-2">
              Limpiar búsqueda
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVacancies.map((vacancy) => {
            const locationUrl = getSafeMapsUrl(vacancy.locationUrl);

            return (
              <article
                key={vacancy.id}
                className={cn(
                  VACANCY_CARD_CLASS,
                  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-4 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-5",
                  CARD_MOTION_CLASS,
                )}
              > 
                <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-lg bg-accent text-base font-bold text-surface">{getInitials(vacancy.companyName)}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-ink"><Link href={`/vacancies/${vacancy.id}`} onClick={(event) => openVacancy(event, vacancy.id)} className="underline-offset-4 hover:text-accent hover:underline">{vacancy.title}</Link></h2>{canApply ? <AppliedJobChip jobOfferId={vacancy.id} /> : null}</div>
                  <p className="mt-1 text-sm font-medium text-ink-soft">{vacancy.companyName}</p>
                  <p className="mt-2 line-clamp-2 max-w-prose text-sm leading-relaxed text-text-secondary">{vacancy.description}</p>
                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div><dt className="sr-only">Salario</dt><dd className="rounded-md bg-interaction px-2.5 py-1 font-semibold text-accent tabular-nums">{vacancy.salary}</dd></div>
                    <div><dt className="sr-only">Modalidad</dt><dd className="flex items-center gap-1.5 text-ink-soft"><ModalityIcon modality={vacancy.modality} className="size-4" />{vacancy.modality}</dd></div>
                    <div><dt className="sr-only">Contrato</dt><dd className="flex items-center gap-1.5 text-ink-soft"><BriefcaseBusiness aria-hidden="true" className="size-4" />{vacancy.contractType}</dd></div>
                    {locationUrl ? <div><dt className="sr-only">Ubicación</dt><dd><a href={locationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline">Ver ubicación<span className="sr-only"> de {vacancy.title}</span><ExternalLink className="size-3.5" aria-hidden="true" /></a></dd></div> : null}
                  </dl>
                  {vacancy.requirements.length > 0 ? <ul aria-label="Habilidades requeridas" className="mt-3 flex flex-wrap gap-2">{vacancy.requirements.map((requirement) => <li key={requirement}><Badge className="bg-availability text-availability-foreground">{requirement}</Badge></li>)}</ul> : null}
                </div>
                <div className="col-span-2 flex flex-col items-start gap-3 md:col-span-1 md:items-end md:justify-between md:gap-4 md:self-stretch">
                  <VacancyDateBadges publishedAt={vacancy.publishedAt} expiresAt={vacancy.expiresAt} className="md:justify-end" />
                  <Link href={`/vacancies/${vacancy.id}`} onClick={(event) => openVacancy(event, vacancy.id)} className={buttonVariants({ variant: "ghost", className: "text-accent hover:text-accent max-md:h-11" })} aria-label={`Ver detalles de ${vacancy.title}`}>Ver detalles<ArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedId !== null && !isLoading ? <VacancyDetailDialog vacancy={vacancies.find((item) => item.id === selectedId) ?? null} onClose={closeVacancy} /> : null}
    </main>
  );
}
