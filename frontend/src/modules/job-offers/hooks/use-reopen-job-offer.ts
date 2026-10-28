"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REOPEN_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOfferActionVariables } from "../types/job-offer-action-variables.types";
import { toReopenErrorMessage } from "../utils/to-reopen-error-message";

export function useReopenJobOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, jobOfferId }: JobOfferActionVariables) =>
      jobOffersService.reopen(companyId, jobOfferId),
    onSuccess: () => toast.success(REOPEN_JOB_OFFER_TEXT.success, TOAST_OPTIONS),
    onError: (error) => toast.error(toReopenErrorMessage(error), TOAST_OPTIONS),
    // Se refresca siempre: tras un éxito cambia la etiqueta y tras un 409 se muestra el estado real.
    onSettled: (_data, _error, { companyId }) =>
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEYS.company(companyId) }),
  });
}
