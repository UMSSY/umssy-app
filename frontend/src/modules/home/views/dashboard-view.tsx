"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Compass } from "lucide-react";
import { useAuth } from "@/shared/contexts/auth-context";
import { WORKSPACE_AREAS } from "@/shared/config/workspace-navigation.config";
import { getWorkspaceTasks } from "@/shared/utils/get-workspace-tasks";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { getRolesLabel } from "@/modules/auth";
import { buttonVariants } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout";
import { cn } from "cn";

export function DashboardView() {
  const { roles, isLoading } = useAuth();
  const tasks = getWorkspaceTasks(roles);
  const areas = WORKSPACE_AREAS.filter((area) => tasks.some((task) => task.area === area.id));
  const canExploreMentors = roles.some((role) => getRouteRoles("/mentorship/mentors").includes(role));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeading
        title="Inicio"
        description="Tu comunidad, tu trayectoria y tus próximos pasos."
        className="border-0 pb-2"
        actions={<div className="flex flex-col items-end gap-4"><span className="text-xs text-text-secondary">{getRolesLabel(roles)}</span>{canExploreMentors ? <Link href="/mentorship/mentors" className={buttonVariants()}>Ver mentores<ArrowRight aria-hidden="true" /></Link> : null}</div>}
      />
      {isLoading ? <p role="status" className="text-sm text-text-secondary">Cargando tus espacios…</p> : (
        <section aria-label="Tus espacios" className={cn("grid items-start gap-8", areas.length > 2 ? "grid-cols-3" : areas.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {areas.map((area) => (
            <section key={area.id} aria-labelledby={`area-${area.id}`} className="min-w-0">
              <h2 id={`area-${area.id}`} className="mb-5 flex items-center gap-3 text-lg font-bold text-ink"><area.icon className="size-7 text-accent" strokeWidth={1.5} aria-hidden="true" />{area.label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {tasks.filter((task) => task.area === area.id).map((task) => <li key={task.href}><Link href={task.href} className="group flex min-h-12 items-center gap-3 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-interaction hover:text-accent"><task.icon className="size-4 shrink-0 text-ink-soft" aria-hidden="true" /><span className="flex-1">{task.label}</span><ChevronRight className="size-4 shrink-0 text-text-secondary group-hover:text-accent" aria-hidden="true" /></Link></li>)}
              </ul>
            </section>
          ))}
        </section>
      )}
      {canExploreMentors ? <aside className="flex items-center justify-between gap-6 rounded-lg bg-interaction px-6 py-5"><div className="flex items-center gap-4"><Compass className="size-8 shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" /><p className="font-semibold text-ink">Encuentra orientación para tu próximo paso</p></div><Link href="/mentorship/mentors" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">Explorar mentores<ArrowRight className="size-4" aria-hidden="true" /></Link></aside> : null}
    </main>
  );
}
