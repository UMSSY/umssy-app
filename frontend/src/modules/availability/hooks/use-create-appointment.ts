"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APPOINTMENTS_QUERY_KEYS, appointmentsApi } from "@/modules/appointments";
import { isApiError } from "@/shared/services/api-client";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import {
  APPOINTMENT_CONFLICT_STATUS,
  REQUEST_APPOINTMENT_TEXT,
} from "../constants/request-appointment.constants";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAppointmentVariables } from "../types/create-appointment-variables.types";
import { formatAppointmentSchedule } from "../utils/appointment-request.utils";

export function useCreateAppointment(onConflict: (block: AvailabilityBlock) => void) {
  const queryClient = useQueryClient();
  const isSendingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: ({ block, values }: CreateAppointmentVariables) =>
      appointmentsApi.createAppointment({
        blockId: block.id,
        orientationTypeId: values.orientationTypeId,
        message: values.message.trim() || null,
      }),
    onSuccess: (_appointment, { block }) => {
      toast.success(REQUEST_APPOINTMENT_TEXT.confirmed, {
        description: formatAppointmentSchedule(block),
      });
    },
    onError: (error, { block }) => {
      if (isApiError(error) && error.response?.status === APPOINTMENT_CONFLICT_STATUS) {
        toast.error(getApiErrorDetail(error) ?? REQUEST_APPOINTMENT_TEXT.alreadyBooked);
        onConflict(block);
        return;
      }
      toast.error(getApiErrorDetail(error) ?? REQUEST_APPOINTMENT_TEXT.createError);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all }),
      ]),
  });

  const createAppointment = async (variables: CreateAppointmentVariables): Promise<boolean> => {
    if (isSendingRef.current) return false;
    isSendingRef.current = true;
    try {
      await mutation.mutateAsync(variables);
      return true;
    } catch {
      return false;
    } finally {
      isSendingRef.current = false;
    }
  };

  return { createAppointment, isSubmitting: mutation.isPending };
}
