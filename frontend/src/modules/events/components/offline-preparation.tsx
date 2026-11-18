'use client';

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { createContext, useContext, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/shared/contexts/auth-context';
import { usePwaInstall } from '@/shared/contexts/pwa-install-context';
import { getRouteRoles } from '@/shared/utils/get-route-roles';
import { usePrepareOfflinePasses } from '../hooks/use-prepare-offline-passes';

const PreparationContext = createContext<ReturnType<
  typeof usePrepareOfflinePasses
> | null>(null);

export function OfflinePreparationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { roles, isLoading } = useAuth();
  const state = usePrepareOfflinePasses(
    !isLoading &&
      roles.some((role) => getRouteRoles('/events/my-passes').includes(role)),
  );
  return (
    <PreparationContext.Provider value={state}>
      {children}
    </PreparationContext.Provider>
  );
}

export function OfflinePreparation() {
  const state = useContext(PreparationContext);
  const { install, installed } = usePwaInstall();
  if (!state?.show) return null;

  const { query } = state;
  const preparing = query.isFetching || query.isPending;
  const failed = !preparing && query.isError;
  const Icon = preparing ? LoaderCircle : failed ? CircleAlert : CircleCheck;
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-interaction px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2" role="status">
        <Icon
          className={preparing ? 'size-4 motion-safe:animate-spin' : 'size-4'}
          aria-hidden="true"
        />
        {preparing
          ? 'Guardando tus pases…'
          : failed
            ? 'Datos sin conexión pendientes.'
            : 'Pases listos sin conexión.'}
      </p>
      {failed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
          Reintentar
        </Button>
      ) : null}
      {!preparing && !installed ? (
        install ? (
          <Button size="sm" onClick={install}>
            Instalar app
          </Button>
        ) : (
          <p>En el menú del navegador, busca «Añadir a pantalla de inicio».</p>
        )
      ) : null}
    </section>
  );
}
