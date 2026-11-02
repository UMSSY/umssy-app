import Link from "next/link";
import { CircleX, FileText, Pencil, UsersRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout";

type ParticipationOverviewProps = {
  isActive: boolean;
  areas: string[];
  orientations: string[];
  onAction: () => void;
  actionEnabled?: boolean;
};

type ParticipationPreferencesProps = {
  title: string;
  editHref: string;
  editLabel: string;
  items: string[];
  isEditable: boolean;
  showIcon?: boolean;
};

function ParticipationPreferences({ title, editHref, editLabel, items, isEditable, showIcon }: ParticipationPreferencesProps) {
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-ink">{title}</h2>
        {isEditable && (
          <Link href={editHref} className={buttonVariants({ variant: "outline", className: "h-auto min-h-10 gap-2 bg-interaction px-3 py-2 text-availability-foreground whitespace-normal" })}>
            <Pencil aria-hidden="true" className="size-4" />{editLabel}
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="inline-flex max-w-full items-center gap-2 rounded-md bg-interaction px-3 py-2 text-sm break-words text-availability-foreground">
            {showIcon && <FileText aria-hidden="true" className="size-4 shrink-0" />}{item}
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-text-secondary">Sin configuración</span>}
      </div>
    </section>
  );
}

export function ParticipationOverview({ isActive, areas, orientations, onAction, actionEnabled = true }: ParticipationOverviewProps) {
  return (
    <section className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeading title="Mi participación como mentor" description="Gestiona la información relacionada con tu participación en la red de mentorías." />
        <div className="space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-surface-soft text-text-secondary"}`}>
                <UsersRound aria-hidden="true" className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-ink">Estado de participación</h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-surface-soft text-text-secondary"}`}>
                    <span aria-hidden="true" className={`size-2 rounded-full ${isActive ? "bg-emerald-600" : "bg-text-secondary"}`} />
                    {isActive ? "Activo" : "Desactivado"}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {isActive ? "Tu perfil puede aparecer como mentor disponible en el directorio." : "Tu participación está desactivada y tu perfil no aparece en el directorio. Para regresar deberás completar la incorporación y validar los cupos disponibles."}
                </p>
              </div>
            </div>
            {actionEnabled && (
              <Button type="button" variant={isActive ? "outline" : "default"} onClick={onAction} className="h-auto min-h-10 max-w-full gap-2 py-2 whitespace-normal">
                {isActive && <CircleX aria-hidden="true" className="size-4" />}
                {isActive ? "Desactivar participación" : "Activar participación"}
              </Button>
            )}
          </div>
          <ParticipationPreferences title="Áreas técnicas" editHref="/mentors/participation/technical-areas" editLabel="Editar áreas técnicas" items={areas} isEditable={isActive} />
          <ParticipationPreferences title="Tipos de orientación" editHref="/mentorship/orientation" editLabel="Editar tipos de orientación" items={orientations} isEditable={isActive} showIcon />
        </div>
      </div>
    </section>
  );
}
