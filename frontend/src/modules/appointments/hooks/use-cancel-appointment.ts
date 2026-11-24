"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { AVAILABILITY_QUERY_KEYS } from "@/modules/availability/constants/availability-query-keys.constants";
import { APPOINTMENTS_QUERY_KEYS } from "../constants/appointments-query-keys.constants";
import { CANCEL_APPOINTMENT_TEXT } from "../constants/cancel-appointment.constants";
import { appointmentsApi } from "../services/appointments.service";
import type { CancelAppointmentVariables } from "../types/cancel-appointment-variables.types";

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, reason }: CancelAppointmentVariables) =>
      appointmentsApi.cancel(appointmentId, reason),
    onSuccess: async () => {
      toast.success(CANCEL_APPOINTMENT_TEXT.success);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEYS.all }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? CANCEL_APPOINTMENT_TEXT.error);
    },
  });
}
