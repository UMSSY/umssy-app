import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { VacancyList } from "@/modules/job-offers";
import { RECRUITERS_ROUTES } from "../constants/navigation";

export function RecruitersHomeView() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeading
        title="Portal de empresas"
        description="Publica oportunidades y encuentra candidatos."
      />
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-ink">Mis vacantes publicadas</h2>
          <Link href={RECRUITERS_ROUTES.newJobOffer} className={buttonVariants()}>
            Registrar nueva vacante
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <VacancyList />
      </section>
    </main>
  );
}