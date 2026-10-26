import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Info, Pencil, UserRoundX, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeading } from "@/shared/components/layout";
import { updateMentorParticipation } from "../../services/mentor-participation.service";
import type { MentorParticipation } from "../../services/mentor-participation.service";
import { ActivateParticipationModal } from "./activate-participation-modal";
import { DeactivateParticipationModal } from "./deactivate-participation-modal";

type ParticipationOverviewProps = {
  isActive: boolean;
  areas: string[];
  orientations: string[];
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

          {isEditable && (
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
          )}
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
  isActive,
  areas,
  orientations,
}: ParticipationOverviewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [participationOverride, setParticipationOverride] = useState<boolean | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const participationIsActive = participationOverride ?? isActive;

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleParticipationChange = async (nextIsActive: boolean) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMentorParticipation(nextIsActive);
      setParticipationOverride(nextIsActive);
      queryClient.setQueryData<MentorParticipation | null>(
        ["mentors", "participation"],
        (previous) =>
          previous
            ? { ...previous, isActive: nextIsActive }
            : {
                isActive: nextIsActive,
                areas,
                orientations,
                technicalAreaIds: [],
                orientationTypeIds: [],
              },
      );
      setIsActivateModalOpen(false);
      setIsDeactivateModalOpen(false);
      setSuccessMessage(
        nextIsActive
          ? "Participación como mentor reactivada correctamente."
          : "Has desactivado tu participación temporalmente.",
      );
    } catch {
      setErrorMessage(
        nextIsActive
          ? "No se pudo activar tu participación. Intenta nuevamente."
          : "No se pudo desactivar tu participación. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = () => {
    if (isSubmitting) return;
    setIsActivateModalOpen(false);
    router.push("/mentorship");
  };

  return (
    <main className="min-h-full bg-background">
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex max-w-md items-center gap-2.5 rounded-xl border border-border bg-ink px-4 py-3 text-white shadow-xl"
        >
          <CheckCircle2
            aria-hidden="true"
            className="shrink-0 text-green-400"
            size={19}
          />
          <span className="text-xs font-medium">{successMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Cerrar notificación"
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-white hover:text-white"
          >
            ×
          </Button>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <PageHeading title="Mi participación como mentor" description="Gestiona tus áreas técnicas y tipos de orientación." actions={<Link href="/mentor/availability" className={buttonVariants()}>Gestionar disponibilidad</Link>} />
        </div>

        <Card className="gap-0 overflow-visible rounded-lg border border-border bg-surface py-0 text-base shadow-none ring-0">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-base font-semibold text-ink">
                    Estado de participación
                  </CardTitle>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                      participationIsActive
                        ? "bg-green-100 text-green-800"
                        : "border border-danger/20 bg-danger/5 text-danger"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${
                        participationIsActive ? "bg-green-600" : "bg-danger"
                      }`}
                    />
                    {participationIsActive ? "Activo" : "Desactivado"}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {participationIsActive
                    ? "Tu perfil puede aparecer como mentor disponible en el directorio."
                    : "Tu perfil puede aparecer como mentor no disponible en el directorio."}
                </p>
              </div>
              {participationIsActive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-2 text-xs"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsDeactivateModalOpen(true);
                  }}
                >
                  <UserRoundX aria-hidden="true" size={15} />
                  Desactivar participación
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-9 gap-2 bg-accent text-xs text-accent-foreground hover:bg-brand-hover"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsActivateModalOpen(true);
                  }}
                >
                  <Zap aria-hidden="true" size={15} />
                  Activar participación
                </Button>
              )}
            </div>
            {!participationIsActive && (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-3.5">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-danger"
                  size={16}
                />
                <p className="text-xs leading-relaxed text-text-secondary">
                  Tus preferencias y credenciales continúan guardadas con total
                  seguridad. Al reactivar, tus áreas y opciones volverán a estar
                  activas de inmediato.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 lg:grid-cols-2">
        <ParticipationPreferencesCard
          title="Áreas técnicas"
          editHref="/mentors/participation/technical-areas"
          editLabel="Editar áreas técnicas"
          items={areas}
          isEditable={participationIsActive}
        />

        <ParticipationPreferencesCard
          title="Tipos de orientación"
          editHref="/mentorship/orientation"
          editLabel="Editar tipos de orientación"
          items={orientations}
          isEditable={participationIsActive}
        />
        </div>
      </div>
      <DeactivateParticipationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsDeactivateModalOpen(false);
        }}
        onConfirm={() => void handleParticipationChange(false)}
        isLoading={isSubmitting}
        errorMessage={errorMessage}
        areas={areas}
        orientations={orientations}
      />
      <ActivateParticipationModal
        isOpen={isActivateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsActivateModalOpen(false);
        }}
        onConfirm={handleReactivate}
        isLoading={false}
        errorMessage={errorMessage}
      />
    </main>
  );
}
