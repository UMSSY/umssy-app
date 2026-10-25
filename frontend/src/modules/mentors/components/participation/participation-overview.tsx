import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, UserRoundX } from "lucide-react";
import { useAuth } from "@/shared/contexts/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeading } from "@/shared/components/layout";
import { DeactivateParticipationModal } from "./deactivate-participation-modal";
import { deactivateMentorParticipation } from "../../services/mentor-participation.service";

type ParticipationOverviewProps = {
  areas: string[];
  orientations: string[];
};

type ParticipationPreferencesCardProps = {
  title: string;
  editHref: string;
  editLabel: string;
  items: string[];
};

function ParticipationPreferencesCard({
  title,
  editHref,
  editLabel,
  items,
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

          <Link
            href={editHref}
            className={buttonVariants({
               variant: "outline",
               className:
               "h-auto gap-2 rounded-md bg-surface-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-border hover:text-ink active:translate-y-0",
})}
          >
            <Pencil size={14} /> {editLabel}
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-md bg-surface-soft px-3 py-1.5 text-xs text-ink"
            >
              {item}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ParticipationOverview({
  areas,
  orientations,
}: ParticipationOverviewProps) {
  const router = useRouter();
  const { refreshRoles } = useAuth();
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivationError, setDeactivationError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (isDeactivating) return;

    setIsDeactivating(true);
    setDeactivationError(null);
    try {
      await deactivateMentorParticipation();
      await refreshRoles();
      setIsDeactivateModalOpen(false);
      router.replace("/mentorship");
    } catch {
      setDeactivationError(
        "No se pudo desactivar tu participación. Intenta nuevamente.",
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <PageHeading title="Mi participación como mentor" description="Gestiona tus áreas técnicas y tipos de orientación." actions={<Link href="/mentor/availability" className={buttonVariants()}>Gestionar disponibilidad</Link>} />
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
            <p className="mt-1 text-sm text-text-secondary">
              Tu perfil puede aparecer como mentor disponible en el directorio.
            </p>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 pt-3 pb-5 sm:px-6 sm:pb-6">
            <span className="inline-flex items-center gap-1 bg-transparent p-0 text-sm font-semibold text-ink-soft">
              <Check size={13} /> Activo
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 border-critical-action/30 text-critical-action hover:bg-critical-action/5 hover:text-critical-action"
              onClick={() => {
                setDeactivationError(null);
                setIsDeactivateModalOpen(true);
              }}
            >
              <UserRoundX size={15} />
              Desactivar participación
            </Button>
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-2">
        <ParticipationPreferencesCard
          title="Áreas técnicas"
          editHref="/mentors/participation/technical-areas"
          editLabel="Editar áreas técnicas"
          items={areas}
        />

        <ParticipationPreferencesCard
          title="Tipos de orientación"
          editHref="/mentorship/orientation"
          editLabel="Editar tipos de orientación"
          items={orientations}
        />
        </div>
      </div>
      <DeactivateParticipationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          if (!isDeactivating) setIsDeactivateModalOpen(false);
        }}
        onConfirm={() => void handleDeactivate()}
        isLoading={isDeactivating}
        errorMessage={deactivationError}
        areas={areas}
        orientations={orientations}
      />
    </main>
  );
}
