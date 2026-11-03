"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DELETE_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOfferActionVariables } from "../types/job-offer-action-variables.types";

export function useDeleteJobOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, jobOfferId }: JobOfferActionVariables) =>
      jobOffersService.remove(companyId, jobOfferId),
    networkMode: "always",
    onSuccess: () => toast.success(DELETE_JOB_OFFER_TEXT.success, TOAST_OPTIONS),
    onError: () => toast.error(DELETE_JOB_OFFER_TEXT.error, TOAST_OPTIONS),
    onSettled: (_data, _error, { companyId }) =>
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEYS.company(companyId) }),
  });
}
