"use client";

import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import { useRegistrationSession } from "@/modules/registrations";
import { eventsService } from "../services/events.service";

export function useEvent(id: string | null) {
  const accessToken = useRegistrationSession();
  const query = useQuery({
    queryKey: ["events", "detail", id, accessToken],
    queryFn: ({ signal }) => eventsService.getEvent(id!, signal, accessToken),
    enabled: id !== null,
  });
  const notFound = isApiError(query.error) && query.error.response?.status === 404;
  return {
    event: query.data ?? null,
    isLoading: id !== null && query.isFetching,
    error: query.isError && !query.isFetching ? notFound
      ? "El taller ya no está disponible o no existe."
      : "No se pudo cargar el detalle del taller. Inténtalo nuevamente." : null,
    notFound,
    retry: () => { void query.refetch(); },
  };
}
