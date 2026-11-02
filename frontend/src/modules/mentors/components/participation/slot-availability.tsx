"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { mentorParticipationService } from "../../services/mentor-participation.service";

export function SlotAvailability() {
  const capacity = useQuery({
    queryKey: ["mentor-capacity"],
    queryFn: () => mentorParticipationService.capacity(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  return <section aria-label="Disponibilidad de cupos" className="space-y-3 rounded-lg border border-border bg-surface p-6">
    <h2 className="font-semibold">Disponibilidad de cupos</h2>
    {capacity.isPending && <p role="status">Consultando cupos...</p>}
    {capacity.isError && <div role="alert"><p>No se pudo consultar la disponibilidad.</p><Button variant="outline" onClick={() => void capacity.refetch()}>Reintentar consulta de cupos</Button></div>}
    {capacity.data && <p role="status">{capacity.data.available > 0 ? "Hay cupos disponibles" : "Todos los cupos están ocupados"}</p>}
  </section>;
}
