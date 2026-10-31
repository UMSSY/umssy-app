
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, History, Info, Pencil, Trash2, TriangleAlert, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useMentorshipCatalogs } from "@/modules/mentorship/hooks/use-mentorship-catalogs";
import { isApiError } from "@/shared/services/api-client";
import {
  mentorParticipationService,
  type MentorParticipationRequest,
} from "../../services/mentor-participation.service";

type PendingParticipationProps = {
  request: MentorParticipationRequest;
  onCancelled?: () => void;
  showHeading?: boolean;
};

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return "Tu sesión ha caducado. Inicia sesión nuevamente.";
    }

    if (status === 403) {
      return "No tienes autorización para realizar esta operación.";
    }

    if (status === 404) {
      return "La solicitud ya no existe o no está disponible.";
    }

    if (status === 409) {
      return "La solicitud cambió de estado. Actualiza la página.";
    }

    if (status === 429) {
      return "Has superado el límite de intentos. Se ha aplicado una sanción temporal de 72 horas.";
    }

    const body = error.response?.data;

    if (body && typeof body === "object") {
      const details = body as Record<string, unknown>;

      if (typeof details.detail === "string" && details.detail) {
        return details.detail;
      }

      if (typeof details.message === "string" && details.message) {
        return details.message;
      }
    }
  }

  return "No se pudo completar la operación. Intenta nuevamente.";
}

function formatDate(value?: string): string {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).format(date);
}

export function PendingParticipation({
  request,
  onCancelled,
  showHeading = true,
}: PendingParticipationProps) {
  const queryClient = useQueryClient();

  const {
    technicalAreas,
    orientationTypes,
    isTechnicalAreasLoading,
    isOrientationTypesLoading,
  } = useMentorshipCatalogs();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestAreaIds = request.technicalAreaIds ?? [];
  const requestOrientationIds = request.orientationTypeIds ?? [];

  const resolveNames = (
    ids: string[],
    catalog: { id: string; name: string }[],
  ) =>
    ids.map(
      (id) => catalog.find((entry) => entry.id === id)?.name ?? id,
    );

  const areaNames = resolveNames(requestAreaIds, technicalAreas);
  const orientationNames = resolveNames(
    requestOrientationIds,
    orientationTypes,
  );

  const historyQuery = useQuery({
    queryKey: ["mentor-participation-history", request.userId],
    queryFn: () => mentorParticipationService.getHistory(),
    enabled: historyOpen,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      mentorParticipationService.update({
        technicalAreaIds: selectedAreas,
        orientationTypeIds: selectedOrientations,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-requests"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-history"],
      });

      setEditOpen(false);
      setSuccessMessage(
        "Tus preferencias se actualizaron correctamente. Conservas tu fecha original en la cola FIFO.",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => mentorParticipationService.cancel(),
    onSuccess: async () => {
      setCancelOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-requests"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-history"],
      });
      onCancelled?.();
      setSuccessMessage("Solicitud cancelada correctamente");
    },
  });

  function openEdit() {
    setSelectedAreas([...requestAreaIds]);
    setSelectedOrientations([...requestOrientationIds]);
    updateMutation.reset();
    setEditOpen(true);
  }

  function toggleId(
    id: string,
    selected: string[],
    setter: (value: string[]) => void,
  ) {
    setter(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      {showHeading && <PageHeading
        title="Mi participación como mentor"
        description="Gestiona la información relacionada con tu participación en la red de mentorías."
      />}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-ink"
        >
          {successMessage}
        </div>
      )}

      <section className="space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-notice text-notice-foreground">
              <UsersRound className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-ink">Estado de participación</h2>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-notice px-2 py-1 text-xs font-semibold text-notice-foreground">
                  <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" /> PENDIENTE
                </span>
              </div>
              <p className="text-sm text-text-secondary">Tu solicitud está registrada en la lista de espera.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setOpenedAt(Date.now()); setDetailsOpen(true); }}>
              Ver detalle
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                cancelMutation.reset();
                setCancelOpen(true);
              }}
            >
              Cancelar cupo
            </Button>
          </div>
        </div>

        <div className="space-y-5 border-t border-border pt-5">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-ink">Áreas técnicas</h3>
              <Button variant="outline" onClick={openEdit}><Pencil className="size-4" aria-hidden="true" />Editar áreas técnicas</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {areaNames.map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-interaction px-3 py-2 text-sm text-availability-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-ink">Tipos de orientación</h3>
              <Button variant="outline" onClick={openEdit}><Pencil className="size-4" aria-hidden="true" />Editar tipos de orientación</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {orientationNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-md bg-interaction px-3 py-2 text-sm text-availability-foreground"
                >
                  <FileText aria-hidden="true" className="size-4" />
                  {name}
                </span>
              ))}
            </div>
          </section>
        </div>

      </section>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Estado: Pendiente</DialogTitle>
          <DialogDescription>Tu solicitud está en espera de un cupo. No necesitas enviar otra solicitud.</DialogDescription>
          <span className="font-semibold">En evaluación</span>
          <p>Fecha de registro: {formatDate(request.queuedAt)}</p>
          <p>Tiempo transcurrido: {Math.floor(Math.max(0, openedAt - new Date(request.queuedAt).getTime()) / 3600000)} horas</p>
          <p className="min-w-0 text-sm">Correo institucional: <span className="block truncate font-semibold" title={request.email}>{request.email ?? "Correo institucional no disponible"}</span></p>
          <p className="text-sm text-text-secondary">Modificar tus preferencias conserva tu fecha de ingreso a la lista de espera. Si cancelas y solicitas nuevamente, perderás tu prioridad anterior.</p>
          <Button variant="outline" onClick={() => { setDetailsOpen(false); setHistoryOpen(true); }}><History className="size-4" aria-hidden="true" />Ver historial</Button>
          <Button variant="outline" onClick={() => setDetailsOpen(false)}>Volver</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(value) => { if (!updateMutation.isPending) setEditOpen(value); }}>
        <DialogContent showCloseButton={!updateMutation.isPending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Modificar solicitud pendiente</DialogTitle>

          <DialogDescription>
            Selecciona tus áreas técnicas y tipos de orientación.
            Conservarás tu fecha original de solicitud.
          </DialogDescription>

          {isTechnicalAreasLoading || isOrientationTypesLoading ? (
            <p className="text-sm">Cargando preferencias...</p>
          ) : (
            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="font-semibold text-ink">
                  Áreas técnicas
                </legend>

                {technicalAreas.map((area) => (
                  <label
                    key={area.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-ink"
                  >
                    <Checkbox
                      checked={selectedAreas.includes(area.id)}
                      disabled={updateMutation.isPending}
                      onCheckedChange={() =>
                        toggleId(
                          area.id,
                          selectedAreas,
                          setSelectedAreas,
                        )
                      }
                    />
                    {area.name}
                  </label>
                ))}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="font-semibold text-ink">
                  Tipos de orientación
                </legend>

                {orientationTypes.map((orientation) => (
                  <label
                    key={orientation.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-ink"
                  >
                    <Checkbox
                      checked={selectedOrientations.includes(orientation.id)}
                      disabled={updateMutation.isPending}
                      onCheckedChange={() =>
                        toggleId(
                          orientation.id,
                          selectedOrientations,
                          setSelectedOrientations,
                        )
                      }
                    />
                    {orientation.name}
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {updateMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getErrorMessage(updateMutation.error)}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => setEditOpen(false)}
            >
              Volver
            </Button>

            <Button
              disabled={
                updateMutation.isPending ||
                selectedAreas.length === 0 ||
                selectedOrientations.length === 0 ||
                isTechnicalAreasLoading ||
                isOrientationTypesLoading
              }
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={(value) => { if (!cancelMutation.isPending) setCancelOpen(value); }}>
        <DialogContent showCloseButton={!cancelMutation.isPending} aria-busy={cancelMutation.isPending} className="max-h-[calc(100dvh-2rem)] grid-cols-1 gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <header className="flex items-center gap-4 border-b border-border px-5 py-5 pr-12 sm:px-6 sm:pr-12">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert aria-hidden="true" size={28} />
            </div>
            <div>
              <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-bold uppercase text-red-700">Confirmar acción</span>
              <DialogTitle className="mt-2 text-xl leading-tight font-bold text-ink">¿Cancelar solicitud de cupo?</DialogTitle>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <DialogDescription className="text-base leading-relaxed text-text-secondary">
              ¿Estás seguro de que deseas cancelar tu solicitud para participar como mentor?
            </DialogDescription>
            <div className="flex items-start gap-3 rounded-lg border border-availability bg-interaction p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-availability-foreground" />
              <div>
                <h3 className="font-bold text-ink">Información importante</h3>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">Si cancelas tu solicitud, perderás tu lugar en la lista de espera (FIFO). Si decides solicitar nuevamente un cupo, ingresarás al final de la cola.</p>
              </div>
            </div>
            {cancelMutation.isError && (
              <p role="alert" className="text-sm text-destructive">{getErrorMessage(cancelMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 rounded-b-xl bg-surface-soft px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelOpen(false)}
            >
              Volver
            </Button>

            <Button
              variant="brand"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {cancelMutation.isPending
                ? "Cancelando..."
                : "Confirmar cancelación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Historial de solicitudes</DialogTitle>

          <DialogDescription>
            Consulta tus solicitudes registradas.
          </DialogDescription>

          {historyQuery.isLoading && (
            <p className="text-sm">Cargando historial...</p>
          )}

          {historyQuery.isError && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {getErrorMessage(historyQuery.error)}
              </p>

              <Button
                variant="outline"
                onClick={() => void historyQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          )}

          {historyQuery.isSuccess &&
            historyQuery.data.length === 0 && (
              <p className="text-sm text-text-secondary">
                No tienes solicitudes registradas.
              </p>
            )}

          {historyQuery.isSuccess && (
            <div className="space-y-3">
              {historyQuery.data.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border bg-surface-soft p-4"
                >
                  <p className="font-semibold text-ink">
                    Estado: {entry.status}
                  </p>

                  <p className="mt-2 text-sm text-text-secondary">
                    Registrada: {formatDate(entry.queuedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setHistoryOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
