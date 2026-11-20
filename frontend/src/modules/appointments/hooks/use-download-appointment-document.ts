"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadFile } from "@/shared/utils/download-file";
import { APPOINTMENT_DETAIL_TEXT } from "../constants/appointments.constants";
import { appointmentsApi } from "../services/appointments.service";
import type { DownloadAppointmentDocumentVariables } from "../types/download-appointment-document-variables.types";

export function useDownloadAppointmentDocument() {
  return useMutation({
    mutationFn: async ({ appointmentId, fileName }: DownloadAppointmentDocumentVariables) => {
      const file = await appointmentsApi.downloadDocument(appointmentId);
      downloadFile(file, fileName);
    },
    onError: () => {
      toast.error(APPOINTMENT_DETAIL_TEXT.downloadError);
    },
  });
}
