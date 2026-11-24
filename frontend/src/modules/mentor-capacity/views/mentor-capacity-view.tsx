'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  Users,
  UserRoundCheck,
  Clock3,
  TicketCheck,
  UserRoundPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkspacePage } from '@/shared/components/layout/workspace-page';
import { MentorCapacityMetric } from '../components/mentor-capacity-summary';
import { MentorCapacityPageControls } from '../components/mentor-capacity-page-controls';
import { MentorCapacityPerson } from '../components/mentor-capacity-person';
import {
  useMentorCapacityOverview,
  useMentorOfferHistory,
  useRefreshMentorCapacity,
  useUpdateMentorCapacity,
  useWaitingMentorRequests,
} from '../hooks/use-mentor-capacity';
import type { MentorOfferRecord } from '../types/mentor-capacity.types';
import {
  formatMentorCapacityDate,
  percentageForCapacity,
  validatePercentage,
} from '../utils/mentor-capacity.utils';

function offerStatusLabel(status: MentorOfferRecord['status']) {
  switch (status) {
    case 'OFFERED':
      return 'Vigente';
    case 'CONFIRMED':
      return 'Confirmada';
    case 'EXPIRED':
      return 'Vencida';
  }
}

export function MentorCapacityView() {
  const overview = useMentorCapacityOverview();
  const [requestPage, setRequestPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const requests = useWaitingMentorRequests(requestPage);
  const offers = useMentorOfferHistory(offerPage);
  const refresh = useRefreshMentorCapacity();
  const [percentageInput, setPercentageInput] = useState<string | undefined>();
  const [capacityInput, setCapacityInput] = useState<string | undefined>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [capacityValidationError, setCapacityValidationError] = useState<
    string | null
  >(null);

  const savePercentage = useUpdateMentorCapacity();
  const save = (percentage: number) => {
    savePercentage.mutate(percentage, {
      onSuccess: (data) => {
        setPercentageInput(String(data.percentage));
        setCapacityInput(String(data.capacity));
        setValidationError(null);
      },
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (capacityValidationError) return;
    const inputValue =
      percentageInput ?? String(overview.data?.percentage ?? '');
    const error = validatePercentage(inputValue);
    if (error) return setValidationError(error);
    const percentage = Number(inputValue);
    setValidationError(null);
    save(percentage);
  };

  const handlePercentageChange = (value: string) => {
    setPercentageInput(value);
    setCapacityInput(undefined);
    setValidationError(null);
    setCapacityValidationError(null);
    savePercentage.reset();
  };

  const handleCapacityChange = (value: string) => {
    setCapacityInput(value);
    setCapacityValidationError(null);
    setValidationError(null);
    savePercentage.reset();

    const result = percentageForCapacity(
      value,
      overview.data?.approvedGraduates,
    );
    if (result.error) return setCapacityValidationError(result.error);
    setPercentageInput(String(result.percentage));
  };

  const data = overview.data;
  const inputValue = percentageInput ?? String(data?.percentage ?? '');
  const parsedPercentage = /^[0-9]+$/.test(inputValue)
    ? Number(inputValue)
    : Number.NaN;
  const previewCapacity =
    data && parsedPercentage >= 1 && parsedPercentage <= 100
      ? Math.ceil((data.approvedGraduates * parsedPercentage) / 100)
      : data?.capacity;
  const minimumPercentage =
    data && data.approvedGraduates > 0
      ? (data.occupied / data.approvedGraduates) * 100
      : 0;
  const isRefreshing =
    overview.isFetching || requests.isFetching || offers.isFetching;

  return (
    <WorkspacePage
      title="Control de cupos"
      description="Supervisa la capacidad de la red, configura el porcentaje de participación y consulta la asignación automática FIFO."
      actions={
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs font-medium text-ink">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-ink-soft"
          />
          Algoritmo de asignación FIFO activo (primero en entrar, primero en
          salir)
          <Button
            aria-label="Actualizar datos"
            className="ml-1"
            disabled={isRefreshing}
            onClick={() => void refresh()}
            size="sm"
            variant="outline"
          >
            Actualizar
          </Button>
        </div>
      }
    >
      {overview.isLoading ? (
        <div className="space-y-4" aria-label="Cargando capacidad">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card className="h-32 animate-pulse bg-surface-soft" key={item} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[4, 5].map((item) => (
              <Card className="h-32 animate-pulse bg-surface-soft" key={item} />
            ))}
          </div>
        </div>
      ) : overview.isError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-5"
          role="alert"
        >
          <p>No se pudo cargar el control de cupos.</p>
          <Button
            className="mt-3"
            onClick={() => void overview.refetch()}
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      ) : data ? (
        <>
          <section aria-label="Resumen de capacidad" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MentorCapacityMetric
                detail="Habilitados en base"
                icon={Users}
                label="Titulados aprobados"
                value={data.approvedGraduates}
              />
              <MentorCapacityMetric
                detail="Ocupando cupo"
                icon={UserRoundCheck}
                label="Mentores activos"
                value={data.activeMentors}
              />
              <MentorCapacityMetric
                detail="En plazo de respuesta"
                icon={TicketCheck}
                label="Ofertas reservadas"
                value={data.reservedOffers}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MentorCapacityMetric
                detail={`Límite calculado: ${data.capacity}`}
                icon={UserRoundPlus}
                label="Cupos disponibles"
                value={data.available}
              />
              <MentorCapacityMetric
                detail="En espera de asignación"
                icon={Clock3}
                label="Solicitudes pendientes"
                value={data.pendingRequests}
              />
            </div>
          </section>

          <Card className="mt-6 gap-5 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-accent">
                Configuración de Capacidad Máxima
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Define el porcentaje máximo de titulados aprobados autorizados
                para participar como mentores.
              </p>
            </div>
            <form
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              onSubmit={handleSave}
            >
              <div>
                <label
                  className="mb-2 flex h-8 items-end text-xs font-semibold tracking-wide text-text-secondary uppercase"
                  htmlFor="mentor-capacity-percentage"
                >
                  Porcentaje máximo de participación (%)
                </label>
                <div className="relative">
                  <Input
                    aria-describedby={
                      validationError ? 'mentor-capacity-error' : undefined
                    }
                    aria-invalid={Boolean(validationError)}
                    id="mentor-capacity-percentage"
                    inputMode="numeric"
                    onChange={(event) =>
                      handlePercentageChange(event.target.value)
                    }
                    type="text"
                    value={inputValue}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-secondary">
                    %
                  </span>
                </div>
                {validationError ? (
                  <p
                    className="mt-1 text-sm text-destructive"
                    id="mentor-capacity-error"
                    role="alert"
                  >
                    {validationError}
                  </p>
                ) : null}
                {savePercentage.isError ? (
                  <p className="mt-1 text-sm text-destructive" role="alert">
                    Error del servidor o de conexión. El último porcentaje
                    consultado es {data?.percentage}%. Actualiza los datos para
                    verificar el estado antes de volver a intentarlo.
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  className="mb-2 flex h-8 items-end text-xs font-semibold tracking-wide text-text-secondary uppercase"
                  htmlFor="mentor-capacity-maximum"
                >
                  Número de cupos máximos (cantidad)
                </label>
                <div className="relative">
                  <Input
                    aria-describedby={
                      capacityValidationError
                        ? 'mentor-capacity-count-error'
                        : undefined
                    }
                    aria-invalid={Boolean(capacityValidationError)}
                    id="mentor-capacity-maximum"
                    inputMode="numeric"
                    onChange={(event) =>
                      handleCapacityChange(event.target.value)
                    }
                    type="text"
                    value={capacityInput ?? String(previewCapacity ?? '')}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-secondary">
                    cupos
                  </span>
                </div>
                {capacityValidationError ? (
                  <p
                    className="mt-1 text-sm text-destructive"
                    id="mentor-capacity-count-error"
                    role="alert"
                  >
                    {capacityValidationError}
                  </p>
                ) : null}
              </div>
              <Button
                className="md:col-span-2 md:justify-self-end xl:col-span-1 xl:mt-10 xl:self-start"
                disabled={
                  savePercentage.isPending || Boolean(capacityValidationError)
                }
                type="submit"
                variant="brand"
              >
                <Check aria-hidden="true" />
                {savePercentage.isPending ? 'Guardando...' : 'Guardar límite'}
              </Button>
            </form>
            <div className="flex gap-3 rounded-lg border border-border bg-surface-soft p-4 text-sm">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-ink-soft"
              />
              <p>
                <strong>Límite inferior obligatorio:</strong> las
                participaciones activas y ofertas vigentes no se eliminan al
                reducir el porcentaje. Actualmente hay {data.occupied} plazas
                comprometidas ({data.activeMentors} mentores activos +{' '}
                {data.reservedOffers} ofertas reservadas). Si el nuevo límite
                queda por debajo de esa cantidad, se mostrarán cero cupos
                disponibles hasta que se liberen plazas. El porcentaje de
                referencia para cubrir la ocupación actual es aproximadamente{' '}
                {minimumPercentage.toLocaleString('es', {
                  maximumFractionDigits: 1,
                })}
                %.
              </p>
            </div>
          </Card>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <Card className="gap-0">
              <div className="p-5">
                <h2 className="font-semibold text-accent">Lista de espera</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Solicitudes pendientes en orden FIFO.
                </p>
              </div>
              {requests.isError ? (
                <div className="p-5 text-sm text-destructive" role="alert">
                  No se pudo cargar la lista de espera.
                  <Button
                    className="ml-2"
                    onClick={() => void requests.refetch()}
                    size="sm"
                    variant="outline"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Fecha de solicitud</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.data?.items.length ? (
                        requests.data.items.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <MentorCapacityPerson {...request} />
                            </TableCell>
                            <TableCell>
                              {formatMentorCapacityDate(request.queuedAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            className="py-8 text-center text-text-secondary"
                            colSpan={2}
                          >
                            No hay solicitudes pendientes.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <MentorCapacityPageControls
                    page={requestPage}
                    totalItems={requests.data?.totalItems ?? 0}
                    onChange={setRequestPage}
                  />
                </>
              )}
            </Card>

            <Card className="gap-0">
              <div className="p-5">
                <h2 className="font-semibold text-accent">
                  Registro de ofertas
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Historial de ofertas creadas automáticamente y su estado.
                </p>
              </div>
              {offers.isError ? (
                <div className="p-5 text-sm text-destructive" role="alert">
                  No se pudo cargar el registro de ofertas.
                  <Button
                    className="ml-2"
                    onClick={() => void offers.refetch()}
                    size="sm"
                    variant="outline"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.data?.items.length ? (
                        offers.data.items.map((offer) => (
                          <TableRow key={offer.id}>
                            <TableCell>
                              <MentorCapacityPerson {...offer} />
                            </TableCell>
                            <TableCell>
                              {formatMentorCapacityDate(offer.offeredAt)}
                            </TableCell>
                            <TableCell>
                              {offerStatusLabel(offer.status)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            className="py-8 text-center text-text-secondary"
                            colSpan={3}
                          >
                            Aún no se han realizado ofertas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <MentorCapacityPageControls
                    page={offerPage}
                    totalItems={offers.data?.totalItems ?? 0}
                    onChange={setOfferPage}
                  />
                </>
              )}
            </Card>
          </section>
        </>
      ) : null}
    </WorkspacePage>
  );
}
