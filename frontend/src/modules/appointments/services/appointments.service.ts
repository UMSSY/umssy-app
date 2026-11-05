import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import {
  APPOINTMENT_DOCUMENT_FIELD_NAME,
  getAppointmentDocumentEndpoint,
} from "../constants/appointment-document.constants";
import type { Appointment } from "../types/appointment.types";
import type { AppointmentDocument } from "../types/appointment-document.types";
import type { AppointmentScope } from "../types/appointment-scope.types";
import type { CreateAppointmentInput } from "../types/create-appointment-input.types";

export const appointmentsApi = {
  getMyAppointments: async (scope: AppointmentScope): Promise<Appointment[]> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>("/appointments/me", {
      params: { scope },
    });
    return response.data.data;
  },

  createAppointment: async (input: CreateAppointmentInput): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>("/appointments", input);
    return response.data.data;
  },

  uploadDocument: async (appointmentId: string, file: File): Promise<AppointmentDocument> => {
    const formData = new FormData();
    formData.append(APPOINTMENT_DOCUMENT_FIELD_NAME, file);
    const response = await apiClient.post<ApiResponse<AppointmentDocument>>(
      getAppointmentDocumentEndpoint(appointmentId),
      formData,
    );
    return response.data.data;
  },
};
