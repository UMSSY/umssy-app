'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  UserRoundCheck,
  Clock3,
  TicketCheck,
  UserRoundPlus,
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  mentorCapacityService,
  MENTOR_CAPACITY_PAGE_SIZE,
} from '../services/mentor-capacity.service';
import type { MentorOfferRecord } from '../types/mentor-capacity.types';

const overviewKey = ['mentor-capacity', 'overview'];
const requestsKey = ['mentor-capacity', 'requests'];
const offersKey = ['mentor-capacity', 'offers'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-text-secondary">
        <span>{label}</span>
        <Icon aria-hidden="true" className="size-4 shrink-0" />
      </div>
      <p className="font-tight text-3xl font-bold text-accent">{value}</p>
      <p className="text-xs text-text-secondary">{detail}</p>
    </Card>
  );
}

function PageControls({
  page,
  totalItems,
  onChange,
}: {
  page: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / MENTOR_CAPACITY_PAGE_SIZE),
  );
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary">
      <span>{totalItems} registros</span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          size="sm"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function PersonCell({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  return (
    <div>
      <p className="font-medium text-foreground">
        {firstName} {lastName}
      </p>
      <p className="text-xs text-text-secondary">{email}</p>
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const overview = useQuery({
    queryKey: overviewKey,
    queryFn: ({ signal }) => mentorCapacityService.getOverview(signal),
  });
  const [requestPage, setRequestPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const requests = useQuery({
    queryKey: [...requestsKey, requestPage],
    queryFn: ({ signal }) =>
      mentorCapacityService.getWaitingRequests(requestPage, signal),
  });
  const offers = useQuery({
    queryKey: [...offersKey, offerPage],
    queryFn: ({ signal }) =>
      mentorCapacityService.getOfferHistory(offerPage, signal),
  });
  const [percentageInput, setPercentageInput] = useState<string | undefined>();
  const [capacityInput, setCapacityInput] = useState<string | undefined>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [capacityValidationError, setCapacityValidationError] = useState<
    string | null
  >(null);

  const savePercentage = useMutation({
    mutationFn: mentorCapacityService.updatePercentage,
    onSuccess: async (data) => {
      queryClient.setQueryData(overviewKey, data);
      setPercentageInput(String(data.percentage));
      setCapacityInput(String(data.capacity));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestsKey }),
        queryClient.invalidateQueries({ queryKey: offersKey }),
      ]);
      setValidationError(null);
      toast.success('Límite de participación actualizado.', { duration: 4000 });
    },
    onError: () => {
      toast.error(
        'No se pudo guardar el límite. Revisa tu conexión e inténtalo nuevamente.',
      );
    },
  });

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (capacityValidationError) return;
    const inputValue =
      percentageInput ?? String(overview.data?.percentage ?? '');
    if (!/^[0-9]+$/.test(inputValue)) {
      setValidationError('Ingresa un porcentaje entero entre 1 y 100.');
      return;
    }
    const percentage = Number(inputValue);
    if (percentage < 1 || percentage > 100) {
      setValidationError('El porcentaje debe estar entre 1 y 100.');
      return;
    }
    setValidationError(null);
    savePercentage.mutate(percentage);
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

    const approvedGraduates = overview.data?.approvedGraduates;
    if (!/^[0-9]+$/.test(value)) {
      setCapacityValidationError('Ingresa una cantidad entera de cupos.');
      return;
    }

    const requestedCapacity = Number(value);
    if (!approvedGraduates || requestedCapacity < 1) {
      setCapacityValidationError(
        'La cantidad debe ser al menos 1 y requiere titulados aprobados.',
      );
      return;
    }
    if (requestedCapacity > approvedGraduates) {
      setCapacityValidationError(
        'La cantidad de cupos no puede superar los titulados aprobados.',
      );
      return;
    }

    const matchingPercentages = Array.from({ length: 100 }, (_, index) => {
      const percentage = index + 1;
      return Math.ceil((approvedGraduates * percentage) / 100) ===
        requestedCapacity
        ? percentage
        : null;
    }).filter((percentage): percentage is number => percentage !== null);

    if (matchingPercentages.length === 0) {
      setCapacityValidationError(
        'No hay un porcentaje entero que produzca exactamente esa cantidad de cupos.',
      );
      return;
    }

    const closestPercentage = matchingPercentages.reduce((closest, current) =>
      Math.abs(current - (requestedCapacity * 100) / approvedGraduates) <
      Math.abs(closest - (requestedCapacity * 100) / approvedGraduates)
        ? current
        : closest,
    );
    setPercentageInput(String(closestPercentage));
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
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: ['mentor-capacity'],
              })
            }
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
              <MetricCard
                detail="Habilitados en base"
                icon={Users}
                label="Titulados aprobados"
                value={data.approvedGraduates}
              />
              <MetricCard
                detail="Ocupando cupo"
                icon={UserRoundCheck}
                label="Mentores activos"
                value={data.activeMentors}
              />
              <MetricCard
                detail="En plazo de respuesta"
                icon={TicketCheck}
                label="Ofertas reservadas"
                value={data.reservedOffers}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                detail={`Límite calculado: ${data.capacity}`}
                icon={UserRoundPlus}
                label="Cupos disponibles"
                value={data.available}
              />
              <MetricCard
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
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
              onSubmit={handleSave}
            >
              <div>
                <label
                  className="mb-2 block text-xs font-semibold tracking-wide text-text-secondary uppercase"
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
                    max={100}
                    min={1}
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
                  className="mb-2 block text-xs font-semibold tracking-wide text-text-secondary uppercase"
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
                    max={data.approvedGraduates}
                    min={1}
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
                              <PersonCell {...request} />
                            </TableCell>
                            <TableCell>
                              {formatDate(request.queuedAt)}
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
                  <PageControls
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
                              <PersonCell {...offer} />
                            </TableCell>
                            <TableCell>{formatDate(offer.offeredAt)}</TableCell>
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
                  <PageControls
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
