import Link from "next/link";
import { ArrowRight, Search, SquarePlus, UserRound } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { RECRUITERS_ROUTES } from "../constants/navigation";

export function RecruitersHomeView() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading title="Mi empresa" description="Publica oportunidades y encuentra candidatos." actions={<Link href={RECRUITERS_ROUTES.newJobOffer} className={buttonVariants()}><SquarePlus aria-hidden="true" />Publicar vacante</Link>} />
      <div className="grid grid-cols-3 items-start gap-8">
        <section className="col-span-2 min-w-0 rounded-lg border border-border bg-surface"><header className="border-b border-border px-5 py-4"><h2 className="text-lg font-semibold">Prepara tu próxima publicación</h2></header><ol className="divide-y divide-border px-5 text-sm text-ink-soft">{["Define el cargo, las condiciones y la ubicación", "Describe el puesto y las habilidades requeridas", "Revisa la oferta y confirma su publicación"].map((label, index) => <li key={label} className="flex items-center gap-3 py-5"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-interaction text-xs font-semibold text-accent">{index + 1}</span>{label}</li>)}</ol></section>
        <aside aria-labelledby="company-tasks"><h2 id="company-tasks" className="mb-4 text-lg font-semibold">Herramientas de empresa</h2><ul className="divide-y divide-border rounded-lg border border-border"><li><Link href="/matching" className="flex items-center gap-3 p-4 text-sm font-medium text-accent hover:bg-interaction"><Search className="size-4" aria-hidden="true" /><span className="flex-1">Buscar candidatos</span><ArrowRight className="size-4" aria-hidden="true" /></Link></li><li><Link href="/profile/personal-info" className="flex items-center gap-3 p-4 text-sm font-medium text-accent hover:bg-interaction"><UserRound className="size-4" aria-hidden="true" /><span className="flex-1">Datos de mi perfil</span><ArrowRight className="size-4" aria-hidden="true" /></Link></li></ul></aside>
      </div>
    </main>
  );
}
