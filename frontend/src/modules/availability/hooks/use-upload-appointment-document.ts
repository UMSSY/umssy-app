"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { APPOINTMENTS_QUERY_KEYS, appointmentsApi } from "@/modules/appointments";
import { APPOINTMENT_DOCUMENT_TEXT } from "../constants/appointment-document.constants";
import type { UploadAppointmentDocumentVariables } from "../types/upload-appointment-document-variables.types";

export function useUploadAppointmentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, file }: UploadAppointmentDocumentVariables) =>
      appointmentsApi.uploadDocument(appointmentId, file),
    onError: () => {
      toast.warning(APPOINTMENT_DOCUMENT_TEXT.uploadError);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all }),
  });
}
