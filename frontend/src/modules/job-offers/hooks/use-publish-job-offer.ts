"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PUBLISH_MESSAGES } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { CreateJobOfferPayload } from "../types/create-job-offer-payload.types";
import type { PublishError } from "../types/publish-error.types";
import type { VacancyConditions } from "../types/vacancy-conditions.types";
import { getCurrentCompany } from "../utils/get-current-company";
import { toJobOfferPayload } from "../utils/to-job-offer-payload";
import { toPublishError } from "../utils/to-publish-error";
import { validateInformation, validateRequirements } from "../utils/validate-vacancy";
import type { PublishStatus } from "../types/publish-status.types";
import type { UsePublishJobOfferOptions } from "../types/use-publish-job-offer-options.types";

interface PublishVariables {
  companyId: string;
  payload: CreateJobOfferPayload;
}

function hasErrors(conditions: VacancyConditions): boolean {
  const found = { ...validateInformation(conditions), ...validateRequirements(conditions) };
  return Object.keys(found).length > 0;
}

export function usePublishJobOffer(jobOfferId?: string, options: UsePublishJobOfferOptions = {}) {
  const [localError, setLocalError] = useState<PublishError | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ companyId, payload }: PublishVariables) => {
      if (jobOfferId) {
        await jobOffersService.update(companyId, jobOfferId, payload);
      } else {
        await jobOffersService.publish(companyId, payload);
      }
    },
    networkMode: "always",
    // La raíz de la empresa cubre el listado y los detalles de sus vacantes.
    onSuccess: (_data, { companyId }) => {
      options.onSuccess?.();
      return queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEYS.company(companyId) });
    },
  });

  const submit = async (conditions: VacancyConditions): Promise<void> => {
    if (mutation.isPending) return;

    if (hasErrors(conditions)) {
      setLocalError({ kind: "validation", message: PUBLISH_MESSAGES.incompleteForm, details: [] });
      return;
    }

    const company = getCurrentCompany();
    if (!company.id) {
      setLocalError({ kind: "company", message: PUBLISH_MESSAGES.noCompany, details: [] });
      return;
    }

    setLocalError(null);
    try {
      await mutation.mutateAsync({ companyId: company.id, payload: toJobOfferPayload(conditions) });
    } catch {
      return;
    }
  };

  const reset = () => {
    setLocalError(null);
    mutation.reset();
  };

  const error = localError ?? (mutation.isError ? toPublishError(mutation.error, jobOfferId ? "edit" : "publish") : null);
  const status: PublishStatus = mutation.isPending
    ? "submitting"
    : mutation.isSuccess
      ? "success"
      : error
        ? "error"
        : "idle";

  return {
    status,
    error,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    submit,
    reset,
  };
}