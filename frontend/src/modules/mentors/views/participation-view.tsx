'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/shared/contexts/auth-context';
import { PageBreadcrumb } from '@/shared/components/layout/page-breadcrumb';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { mentorParticipationService } from '../services/mentor-participation.service';
import { PARTICIPATION_BREADCRUMB_ITEMS } from '../constants/participation-breadcrumb.constants';
import { ParticipationEmptyState } from '../components/participation/participation-empty-state';
import { ParticipationLoading } from '../components/participation/participation-loading';
import { ParticipationOverview } from '../components/participation/participation-overview';
import { PendingParticipation } from '../components/participation/pending-participation';
import { SlotOfferParticipation } from '../components/participation/slot-offer-participation';
import { SlotAvailability } from '../components/participation/slot-availability';
import { ActivateParticipationModal } from '../components/participation/activate-participation-modal';
import { DeactivateParticipationModal } from '../components/participation/deactivate-participation-modal';
import { MentorRequestHistoryDetails } from '../components/participation/mentor-request-history-details';
import { MentorRequestHistoryEmptyState } from '../components/participation/mentor-request-history-empty-state';
import { MentorRequestStatusBadge } from '../components/participation/mentor-request-status-badge';
import { useParticipation } from '../hooks/use-participation';
import {
  participationErrorCode,
  participationErrorMessage,
} from '../utils/participation-error';
import {
  loadMentorshipWizardDraft,
  saveMentorshipWizardDraft,
  useMentorProfileDraft,
  useMentorshipCatalogs,
} from '@/modules/mentorship';
import { useCurrentUserId } from '@/modules/mentorship';
import { MentorProfilePreview } from '@/modules/mentorship';

const HISTORY_PAGE_SIZE = 10;

const HISTORY_BREADCRUMB_ITEMS = [
  ...PARTICIPATION_BREADCRUMB_ITEMS.slice(0, -1),
  {
    label: 'Mi participación',
    href: '/mentors/participation',
  },
  {
    label: 'Historial de solicitudes',
  },
];

const getServerToken = () => null;

const notifySuccess = (message: string) => {
  toast.success(message, {
    id: 'mentor-participation-feedback',
    duration: 4000,
    closeButton: true,
  });
};

const formatRequestDateTime = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
};

const formatRequestDateParts = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      day: '--',
      monthYear: 'Fecha no disponible',
    };
  }

  return {
    day: new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
    }).format(parsedDate),
    monthYear: new Intl.DateTimeFormat('es-BO', {
      month: 'short',
      year: 'numeric',
    }).format(parsedDate),
  };
};

const getHistoryErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    if (error.response.status >= 500) {
      return 'El servidor presentó un problema al consultar el historial. Inténtalo nuevamente.';
    }
  }

  return 'No se pudo consultar el historial de solicitudes. Inténtalo nuevamente.';
};

type ParticipationTab = 'current' | 'history';

export function ParticipationView({
  registered = false,
  activated = false,
}: {
  registered?: boolean;
  activated?: boolean;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const { currentUserId: authUserId, refreshRoles } = useAuth();
  const { currentUserId } = useCurrentUserId();
  const { clearAllDrafts } = useMentorProfileDraft();
  const { technicalAreas } = useMentorshipCatalogs();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const token = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken,
  );

  const participation = useParticipation(token);

  const request = useQuery({
    queryKey: ['mentor-participation-requests', token],
    queryFn: () => mentorParticipationService.getCurrent(),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const [activeTab, setActiveTab] = useState<ParticipationTab>('current');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [historyPage, setHistoryPage] = useState(1);

  const history = useQuery({
    queryKey: ['mentor-participation-history', token, historyPage],
    queryFn: ({ signal }) =>
      mentorParticipationService.getHistoryPaginated(
        historyPage,
        HISTORY_PAGE_SIZE,
        signal,
      ),
    enabled: Boolean(token) && activeTab === 'history',
    retry: false,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const [modal, setModal] = useState<'activate' | 'deactivate' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hasDraftStorageError, setHasDraftStorageError] = useState(false);

  const inFlight = useRef(false);
  const navigationFeedbackHandled = useRef(false);

  useEffect(() => {
    clearAllDrafts();
  }, [clearAllDrafts]);

  useEffect(() => {
    if (navigationFeedbackHandled.current || (!registered && !activated))
      return;
    if (participation.isLoading || !request.isSuccess) return;

    navigationFeedbackHandled.current = true;

    const url = new URL(window.location.href);

    const hasActivationFeedback =
      activated && url.searchParams.get('activated') === '1';

    const hasRegistrationFeedback =
      registered && url.searchParams.get('registered') === '1';

    url.searchParams.delete('registered');
    url.searchParams.delete('activated');

    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );

    if (hasActivationFeedback && participation.state?.status === 'ACTIVE') {
      notifySuccess('Participación activada correctamente');
    } else if (
      hasRegistrationFeedback &&
      !hasActivationFeedback &&
      participation.state?.status !== 'ACTIVE' &&
      ['PENDING', 'OFFERED'].includes(request.data?.status ?? '')
    ) {
      notifySuccess('Solicitud de cupo registrada correctamente');
    }
  }, [
    registered,
    activated,
    participation.isLoading,
    participation.state?.status,
    request.isSuccess,
    request.data?.status,
  ]);

  const deactivate = async () => {
    if (inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    try {
      await mentorParticipationService.leave();

      await Promise.allSettled([
        refreshRoles(),
        client.invalidateQueries({
          queryKey: ['mentors', 'participation'],
        }),
        client.invalidateQueries({
          queryKey: ['mentor-participation-requests'],
        }),
        client.invalidateQueries({
          queryKey: ['mentorship', 'directory'],
        }),
        client.invalidateQueries({
          queryKey: ['mentorship', 'profile'],
        }),
      ]);

      setModal(null);
      setIsPreviewOpen(false);
      notifySuccess('Participación desactivada correctamente');
    } catch (failure) {
      setError(failure);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const changeHistoryPage = (page: number) => {
    setHistoryPage(page);
    setSelectedHistoryId(null);
  };

  if (!token) return <ParticipationLoading />;

  const state = participation.state;
  const isActive = state?.status === 'ACTIVE';
  const hasHistory = state?.status === 'DEACTIVATED';
  const currentRequest = request.data;

  const hasOpenRequest = ['PENDING', 'OFFERED'].includes(
    currentRequest?.status ?? '',
  );

  const historyItems = history.data?.items ?? [];
  const totalHistoryRequests = history.data?.total ?? 0;
  const totalHistoryPages = Math.max(1, history.data?.totalPages ?? 1);
  const currentHistoryPage = history.data?.page ?? historyPage;
  const historyStartIndex = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const isChangingHistoryPage =
    history.isFetching && history.data !== undefined;

  const selectedHistoryRequest =
    historyItems.find((item) => item.id === selectedHistoryId) ?? null;

  const technicalAreaNamesById = new Map(
    technicalAreas.map((area) => [area.id, area.name]),
  );

  const resolveTechnicalAreaNames = (ids: string[]) =>
    ids.map(
      (id) => technicalAreaNamesById.get(id) ?? 'Área no disponible',
    );

  // Vista previa del perfil desde Mi participación.
  if (isPreviewOpen && isActive && state && currentUserId) {
    return (
      <MentorProfilePreview
        mentorId={currentUserId}
        technicalAreas={state.areas.map((area) => ({
          ...area,
          description: null,
        }))}
        orientationTypes={state.orientations.map((orientation) => ({
          ...orientation,
          description: null,
        }))}
        onBack={() => setIsPreviewOpen(false)}
        backLabel="Volver"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageBreadcrumb
        items={
          activeTab === 'history'
            ? HISTORY_BREADCRUMB_ITEMS
            : PARTICIPATION_BREADCRUMB_ITEMS
        }
      />

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Participación como mentor
          </h1>

          <p className="text-sm text-muted-foreground">
            Consulta tu participación y revisa tus solicitudes de cupo.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Secciones de participación como mentor"
          className="flex flex-wrap gap-2 border-b pb-3"
        >
          <Button
            id="participation-current-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'current'}
            aria-controls="participation-current-panel"
            variant={activeTab === 'current' ? 'default' : 'outline'}
            onClick={() => setActiveTab('current')}
          >
            Mi participación
          </Button>

          <Button
            id="participation-history-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            aria-controls="participation-history-panel"
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
          >
            Historial de solicitudes
          </Button>
        </div>
      </div>

      <div
        id="participation-current-panel"
        role="tabpanel"
        aria-labelledby="participation-current-tab"
        hidden={activeTab !== 'current'}
        className="space-y-6"
      >
        {participation.isLoading && <ParticipationLoading />}

        {(participation.hasLoadError ||
          (!participation.isLoading && !state)) && (
          <Alert variant="destructive">
            <p>No se pudo cargar tu participación como mentor.</p>

            <Button variant="outline" onClick={() => participation.retry()}>
              Reintentar participación
            </Button>
          </Alert>
        )}

        {request.isPending && (
          <p role="status">Consultando solicitudes de cupo…</p>
        )}

        {request.isError && (
          <Alert variant="destructive">
            <p>No se pudo consultar tu solicitud de cupo.</p>

            <Button variant="outline" onClick={() => void request.refetch()}>
              Reintentar solicitud
            </Button>
          </Alert>
        )}

        {(isActive ||
          (hasHistory && !request.isPending && !hasOpenRequest)) && (
          <ParticipationOverview
            isActive={isActive}
            actionEnabled={
              isActive ||
              (request.isSuccess &&
                !['PENDING', 'OFFERED'].includes(currentRequest?.status ?? ''))
            }
            areas={(state?.areas ?? []).map((area) => area.name)}
            orientations={(state?.orientations ?? []).map(
              (orientation) => orientation.name,
            )}
            onPreview={() => {
              if (!currentUserId) {
                toast.error('No se pudo identificar tu perfil de mentor.');
                return;
              }

              setIsPreviewOpen(true);
            }}
            onAction={() => {
              setError(null);
              setHasDraftStorageError(false);
              setModal(isActive ? 'deactivate' : 'activate');
            }}
          />
        )}

        {!isActive && currentRequest?.status === 'PENDING' && (
          <PendingParticipation
            request={currentRequest}
            onCancelled={() =>
              notifySuccess('Solicitud cancelada correctamente')
            }
          />
        )}

        {!isActive &&
          currentRequest?.status === 'OFFERED' &&
          (currentRequest.offer ? (
            <SlotOfferParticipation
              key={currentRequest.offer.id}
              request={currentRequest}
              onConfirmed={() => {
                void refreshRoles();

                void client.invalidateQueries({
                  queryKey: ['mentors', 'participation'],
                });

                void client.invalidateQueries({
                  queryKey: ['mentorship', 'directory'],
                });

                void client.invalidateQueries({
                  queryKey: ['mentorship', 'profile'],
                });

                notifySuccess('Participación activada correctamente');
              }}
            />
          ) : (
            <Alert variant="destructive">
              No se pudo consultar la oferta. Actualiza la página.
            </Alert>
          ))}

        {state &&
          !participation.hasLoadError &&
          request.isSuccess &&
          !isActive &&
          !hasHistory &&
          !['PENDING', 'OFFERED'].includes(currentRequest?.status ?? '') && (
            <div className="space-y-6">
              <SlotAvailability />
              <ParticipationEmptyState />
            </div>
          )}

        {!isActive && currentRequest?.status === 'EXPIRED' && (
          <p role="status">
            La oferta venció. Puedes revisar las condiciones vigentes en el
            proceso de incorporación.
          </p>
        )}
      </div>

      <div
        id="participation-history-panel"
        role="tabpanel"
        aria-labelledby="participation-history-tab"
        hidden={activeTab !== 'history'}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold">Historial de solicitudes</h2>

        {history.isPending && activeTab === 'history' && (
          <div
            role="status"
            aria-label="Cargando historial de solicitudes"
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Cargando historial de solicitudes...
            </p>

            <div className="animate-pulse overflow-hidden rounded-lg border">
              <div className="h-12 bg-muted/70" />
              <div className="divide-y">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-6 px-4 py-5"
                  >
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-5 w-24 rounded-full bg-muted" />
                    <div className="h-4 w-12 rounded bg-muted" />
                    <div className="h-4 w-12 rounded bg-muted" />
                    <div className="ml-auto h-8 w-24 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {history.isError && (
          <Alert variant="destructive">
            <div className="space-y-3">
              <p role="alert">{getHistoryErrorMessage(history.error)}</p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void history.refetch()}
                >
                  Reintentar
                </Button>

                {historyPage > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => changeHistoryPage(1)}
                  >
                    Volver a la primera página
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        )}

        {history.isSuccess && totalHistoryRequests === 0 && (
          <MentorRequestHistoryEmptyState />
        )}

        {history.isSuccess && totalHistoryRequests > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-sm text-muted-foreground">
                Solicitudes registradas: {totalHistoryRequests}
              </p>

              {isChangingHistoryPage && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-sm text-muted-foreground"
                >
                  Cargando página {historyPage}...
                </p>
              )}
            </div>

            <div
              aria-busy={history.isFetching}
              className={`overflow-x-auto rounded-lg border transition-opacity ${
                isChangingHistoryPage ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <table className="w-full min-w-[980px] text-left text-sm">
                <caption className="sr-only">
                  Historial de solicitudes de cupo como mentor
                </caption>

                <thead className="border-b bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Fecha
                    </th>

                    <th scope="col" className="px-4 py-3 font-medium">
                      Solicitud
                    </th>

                    <th scope="col" className="px-4 py-3 font-medium">
                      Áreas técnicas
                    </th>

                    <th scope="col" className="px-4 py-3 font-medium">
                      Estado
                    </th>

                    <th scope="col" className="px-4 py-3 font-medium">
                      Fecha y hora de registro
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {historyItems.map((item) => {
                    const dateParts = formatRequestDateParts(item.createdAt);
                    const areaNames = resolveTechnicalAreaNames(
                      item.technicalAreaIds,
                    );

                    return (
                      <tr
                        key={item.id}
                        className="align-middle transition-colors hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <div className="min-w-[88px]">
                            <span className="block text-lg leading-none font-semibold">
                              {dateParts.day}
                            </span>

                            <span className="mt-1 block text-xs text-muted-foreground capitalize">
                              {dateParts.monthYear}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="min-w-[190px] font-medium">
                            Solicitud de cupo como mentor
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="flex max-w-[280px] flex-wrap gap-1.5">
                            {areaNames.map((name, index) => (
                              <span
                                key={`${item.id}-area-${index}`}
                                className="rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4">
                          <MentorRequestStatusBadge status={item.status} />
                        </td>

                        <td className="p-4 text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {formatRequestDateTime(item.createdAt)}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isChangingHistoryPage}
                            aria-expanded={selectedHistoryId === item.id}
                            aria-controls="mentor-request-history-details"
                            onClick={() =>
                              setSelectedHistoryId((current) =>
                                current === item.id ? null : item.id,
                              )
                            }
                          >
                            {selectedHistoryId === item.id
                              ? 'Ocultar detalle'
                              : 'Ver detalle'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalHistoryPages > 1 && (
              <nav
                aria-label="Paginación del historial de solicitudes"
                className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
              >
                <p role="status" className="text-sm text-muted-foreground">
                  Mostrando {historyStartIndex + 1}–
                  {Math.min(
                    historyStartIndex + historyItems.length,
                    totalHistoryRequests,
                  )}{' '}
                  de {totalHistoryRequests} solicitudes.
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentHistoryPage === 1 || history.isFetching}
                    onClick={() => changeHistoryPage(currentHistoryPage - 1)}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    Anterior
                  </Button>

                  <span className="px-2 text-sm font-medium" aria-live="polite">
                    Página {currentHistoryPage} de {totalHistoryPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      currentHistoryPage >= totalHistoryPages ||
                      history.isFetching
                    }
                    onClick={() => changeHistoryPage(currentHistoryPage + 1)}
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </nav>
            )}

            {selectedHistoryRequest && !isChangingHistoryPage && (
              <div id="mentor-request-history-details">
                <MentorRequestHistoryDetails
                  request={selectedHistoryRequest}
                  onClose={() => setSelectedHistoryId(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <DeactivateParticipationModal
        isOpen={modal === 'deactivate'}
        onClose={() => setModal(null)}
        onConfirm={() => void deactivate()}
        isLoading={submitting}
        errorMessage={error ? participationErrorMessage(error) : null}
        hasFutureAppointments={
          participationErrorCode(error) === 'MENTOR_HAS_FUTURE_APPOINTMENTS'
        }
        areas={(state?.areas ?? []).map((area) => area.name)}
        orientations={(state?.orientations ?? []).map(
          (orientation) => orientation.name,
        )}
      />

      <ActivateParticipationModal
        isOpen={modal === 'activate'}
        onClose={() => setModal(null)}
        onConfirm={() => {
          void (async () => {
            if (hasDraftStorageError) {
              setModal(null);
              router.push('/mentorship');
              return;
            }

            try {
              if (!authUserId) {
                throw new Error('Identidad no disponible');
              }

              const draft = await loadMentorshipWizardDraft(authUserId);

              if (!draft) {
                await saveMentorshipWizardDraft(authUserId, {
                  currentStep: 1,
                  wantsToParticipate: true,
                  selectedTechnicalAreaIds: (state?.areas ?? []).map(
                    (area) => area.id,
                  ),
                  selectedOrientationTypeIds: (state?.orientations ?? []).map(
                    (orientation) => orientation.id,
                  ),
                });
              }

              setModal(null);
              router.push('/mentorship');
            } catch {
              setHasDraftStorageError(true);
            }
          })();
        }}
        isLoading={false}
        errorMessage={
          hasDraftStorageError
            ? 'No se pudo recuperar el borrador. Puedes continuar y seleccionar tus preferencias nuevamente.'
            : null
        }
      />
    </div>
  );
}
