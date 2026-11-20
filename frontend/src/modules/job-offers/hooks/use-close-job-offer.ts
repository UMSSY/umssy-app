"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CLOSE_JOB_OFFER_TEXT,
  CLOSE_SUCCESS_TOAST_OPTIONS,
  TOAST_OPTIONS,
} from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { JobOfferActionVariables } from "../types/job-offer-action-variables.types";
import {
  getCloseErrorStatus,
  toCloseErrorMessage,
} from "../utils/to-close-error-message";


export function useCloseJobOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, jobOfferId }: JobOfferActionVariables) =>
      jobOffersService.close(companyId, jobOfferId),

    networkMode: "always",

    onSuccess: (_data, { companyId }) => {
      toast.success(CLOSE_JOB_OFFER_TEXT.success, CLOSE_SUCCESS_TOAST_OPTIONS);

      return queryClient.invalidateQueries({
        queryKey: JOB_OFFERS_QUERY_KEYS.company(companyId),
      });
    },

    onError: (error, { companyId }) => {
      toast.error(toCloseErrorMessage(error), TOAST_OPTIONS);

      if (getCloseErrorStatus(error) === 409) {
        return queryClient.invalidateQueries({
          queryKey: JOB_OFFERS_QUERY_KEYS.company(companyId),
        });
      }
    },
  });
}