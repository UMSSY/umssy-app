import Link from "next/link";
import { ArrowUpRight, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/shared/utils/get-initials";
import { FEATURED_COMPANIES_LABELS } from "../constants/featured-companies.labels";
import type { CompanyCardProps } from "../types/company-card-props.types";
import { formatActiveVacancies } from "../utils/format-active-vacancies";

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-6">
      {company.sector ? (
        <p className="mb-3 text-xs font-semibold tracking-wide text-text-secondary uppercase">{company.sector}</p>
      ) : null}
      <div className="flex items-center gap-4">
        <Avatar className="size-12 rounded-md after:rounded-md">
          {company.logoUrl ? (
            <AvatarImage src={company.logoUrl} alt={`Logo de ${company.name}`} className="rounded-md object-contain" />
          ) : null}
          <AvatarFallback className="rounded-md bg-accent font-bold text-surface">{getInitials(company.name)}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold wrap-anywhere text-ink">{company.name}</h3>
      </div>
      {company.description ? (
        <p className="mt-4 line-clamp-3 text-sm text-text-secondary">{company.description}</p>
      ) : null}
      <p className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-accent">
        <Briefcase className="size-4 shrink-0" aria-hidden="true" />
        {formatActiveVacancies(company.activeVacanciesCount)}
      </p>
      <Link
        href="/vacancies"
        aria-label={`${FEATURED_COMPANIES_LABELS.viewVacancies} de ${company.name}`}
        className="group mt-6 flex cursor-pointer items-center justify-between rounded-sm border-t border-border pt-4 text-sm font-semibold text-accent transition-colors hover:text-accent/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {FEATURED_COMPANIES_LABELS.viewVacancies}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}
