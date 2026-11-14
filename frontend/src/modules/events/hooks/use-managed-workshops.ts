'use client';

import { useQuery } from '@tanstack/react-query';
import { useRegistrationSession } from '@/modules/registrations';
import { managedWorkshopsService } from '../services/managed-workshops.service';

export function useManagedWorkshops() {
  const session = useRegistrationSession();
  const query = useQuery({
    queryKey: ['events', 'managed', session],
    queryFn: () => managedWorkshopsService.getMine(),
    retry: false,
  });

  return {
    workshops: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError ? 'La consulta de Mis talleres aún no está disponible. Inténtalo más tarde.' : null,
    retry: () => { void query.refetch(); },
  };
}
