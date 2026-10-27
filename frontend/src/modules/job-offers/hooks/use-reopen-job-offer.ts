// frontend/src/modules/job-offers/hooks/use-reopen-job-offer.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reopenJobOffer } from "../services/reopen-job-offer.service";
import { jobOffersQueryKeys } from "../constants/job-offers-query-keys.constants";

interface ReopenJobOfferVariables {
  companyId: string;
  jobOfferId: string;
}

interface UseReopenJobOfferOptions {
  onSuccess?: () => void;
}

export function useReopenJobOffer(options?: UseReopenJobOfferOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReopenJobOfferVariables>({
    mutationFn: ({ companyId, jobOfferId }) => reopenJobOffer(companyId, jobOfferId),
    onSuccess: () => {
      toast.success("Vacante reabierta correctamente.");
      options?.onSuccess?.();
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo reabrir la vacante. Inténtalo de nuevo.";
      toast.error(message);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: jobOffersQueryKeys.byCompany(variables.companyId),
      });
    },
  });
}