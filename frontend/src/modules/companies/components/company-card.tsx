import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase } from "lucide-react";
import { COMPANY_VACANCIES_HREF } from "../constants/companies.constants";
import type { CompanyCardProps } from "../types/company-card-props.types";

export function CompanyCard({ company }: CompanyCardProps) {
  const count = company.activeVacanciesCount;
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-4">
        {company.logoUrl ? (
          <Image src={company.logoUrl} alt={`Logo de ${company.name}`} width={48} height={48} unoptimized className="size-12 shrink-0 rounded-md border border-border object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent text-lg font-bold text-surface">{company.name.charAt(0).toUpperCase()}</span>
        )}
        <h3 className="line-clamp-2 text-xl font-bold text-ink">{company.name}</h3>
      </div>
      <p className="mb-5 line-clamp-3 text-sm text-text-secondary">{company.description}</p>
      <div className="mt-auto">
        <p className="mb-6 flex w-fit items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          <Briefcase className="size-4 shrink-0" aria-hidden="true" />
          {count === 1 ? "1 vacante disponible" : `${count} vacantes disponibles`}
        </p>
        <Link href={COMPANY_VACANCIES_HREF} aria-label={`Ver vacantes de ${company.name}`} className="group flex cursor-pointer items-center justify-between rounded-sm border-t border-border pt-4 text-sm font-semibold text-accent transition-colors hover:text-accent/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Ver vacantes
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}