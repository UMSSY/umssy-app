'use client';

import { useQuery } from '@tanstack/react-query';
import { useRegistrationSession } from '@/modules/event-registrations';
import { managedWorkshopsService } from '../services/managed-workshops.service';

export function useManagedWorkshops() {
  const session = useRegistrationSession();
  const query = useQuery({
    queryKey: ['events', 'managed', session],
    queryFn: ({ signal }) => managedWorkshopsService.getMine(signal, session),
    retry: false,
  });

  return {
    workshops: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError ? 'No se pudieron cargar tus talleres. Revisa la conexión e inténtalo de nuevo.' : null,
    retry: () => { void query.refetch(); },
  };
}
