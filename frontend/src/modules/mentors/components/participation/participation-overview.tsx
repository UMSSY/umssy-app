import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeading } from "@/shared/components/layout";

type ParticipationOverviewProps = {
  isActive: boolean;
  areas: string[];
  orientations: string[];
  onAction: () => void;
  actionEnabled?: boolean;
};

type ParticipationPreferencesCardProps = {
  title: string;
  editHref: string;
  editLabel: string;
  items: string[];
  isEditable: boolean;
};

function ParticipationPreferencesCard({
  title,
  editHref,
  editLabel,
  items,
  isEditable,
}: ParticipationPreferencesCardProps) {
  return (
    <Card className="gap-0 overflow-visible rounded-lg border border-border bg-surface py-0 text-base shadow-none ring-0">
      <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-4">
          <CardTitle
            role="heading"
            aria-level={2}
            className="text-base font-semibold text-ink"
          >
            {title}
          </CardTitle>

          {isEditable && <Link
            href={editHref}
            className={buttonVariants({
               variant: "outline",
               className:
               "h-auto gap-2 rounded-md bg-surface-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-border hover:text-ink active:translate-y-0",
})}
          >
            <Pencil size={14} /> {editLabel}
          </Link>}
        </div>
      </CardHeader>

      <CardContent className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
                className="max-w-full rounded-md bg-surface-soft px-3 py-1.5 text-xs break-words text-ink"
            >
              {item}
            </span>
          ))}
          {items.length === 0 && <span className="text-sm text-text-secondary">Sin configuración</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ParticipationOverview({
  isActive,
  areas,
  orientations,
  onAction,
  actionEnabled = true,
}: ParticipationOverviewProps) {
  return (
    <section className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <PageHeading title="Mi participación como mentor" description="Consulta tu estado y tus preferencias guardadas." actions={isActive ? <Link href="/mentor/availability" className={buttonVariants()}>Gestionar disponibilidad</Link> : undefined} />
        </div>

        <Card className="gap-0 overflow-visible rounded-lg border border-border bg-surface py-0 text-base shadow-none ring-0">
          <CardHeader className="gap-0 px-6 pt-6">
            <CardTitle
              role="heading"
              aria-level={2}
              className="text-base font-semibold text-ink"
            >
              Estado de participación
            </CardTitle>
            <p className="mt-1 text-sm text-text-secondary">{isActive
              ? "Tu participación está vigente. Tu perfil puede aparecer en el directorio de mentores."
              : "Tu participación está desactivada y tu perfil no aparece en el directorio. Para regresar deberás completar la incorporación y validar los cupos disponibles."}</p>
          </CardHeader>

          <CardContent className="px-5 pt-3 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex rounded-full border border-border bg-surface-soft px-3 py-1 text-sm font-semibold text-ink">
                {isActive ? "Activo" : "Desactivado"}
              </span>
              {actionEnabled && <Button type="button" variant={isActive ? "outline" : "default"} onClick={onAction}>
                {isActive ? "Desactivar participación" : "Activar participación"}
              </Button>}
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-2">
        <ParticipationPreferencesCard
          title="Áreas técnicas"
          editHref="/mentors/participation/technical-areas"
          editLabel="Editar áreas técnicas"
          items={areas}
          isEditable={isActive}
        />

        <ParticipationPreferencesCard
          title="Tipos de orientación"
          editHref="/mentorship/orientation"
          editLabel="Editar tipos de orientación"
          items={orientations}
          isEditable={isActive}
        />
        </div>
      </div>
    </section>
  );
}
