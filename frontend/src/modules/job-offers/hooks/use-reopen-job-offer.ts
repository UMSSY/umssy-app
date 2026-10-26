"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reopenJobOffer } from "../services/reopen-job-offer.service";
import { jobOffersQueryKeys } from "../constants/job-offers-query-keys.constants";


interface ReopenJobOfferVariables {
  jobOfferId: string;
  companyId: string;
}

export function useReopenJobOffer() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReopenJobOfferVariables>({
    mutationFn: ({ jobOfferId }) => reopenJobOffer(jobOfferId),
    onSuccess: () => {
      toast.success("Vacante reabierta correctamente.");
    },
    onError: (error) => {
  // Fallback simple si no tienes la utilidad
     const message = error instanceof Error ? error.message : "No se pudo reabrir la vacante.";
     toast.error(message);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: jobOffersQueryKeys.byCompany(variables.companyId),
      });
    },
  });
}