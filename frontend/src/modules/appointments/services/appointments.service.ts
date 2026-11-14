import { apiClient, isApiError } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getAppointmentDocumentEndpoint, getAppointmentEndpoint, getCounterpartPhotoEndpoint } from "../constants/appointment-document.constants";

import type { Appointment } from "../types/appointment.types";
import type { AppointmentDetail } from "../types/appointment-detail.types";
import type { AppointmentDocument } from "../types/appointment-document.types";
import type { CreateAppointmentInput } from "../types/create-appointment-input.types";
import type { MyAppointmentsPage } from "../types/my-appointments-page.types";
import type { MyAppointmentsQueryParams } from "../types/my-appointments-query-params.types";

export const appointmentsApi = {
  getMyAppointments: async ({ scope, page }: MyAppointmentsQueryParams): Promise<MyAppointmentsPage> => {
    const response = await apiClient.get<ApiResponse<MyAppointmentsPage>>("/appointments/me", {
      params: { scope, page },
    });
    return response.data.data;
  },

  getById: async (appointmentId: string): Promise<AppointmentDetail> => {
    const response = await apiClient.get<ApiResponse<AppointmentDetail>>(
      getAppointmentEndpoint(appointmentId),
    );
    return response.data.data;
  },

  getCounterpartPhoto: async (appointmentId: string): Promise<Blob | null> => {
    try {
      const response = await apiClient.get<Blob>(getCounterpartPhotoEndpoint(appointmentId), {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  downloadDocument: async (appointmentId: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(getAppointmentDocumentEndpoint(appointmentId), {
      responseType: "blob",
    });
    return response.data;
  },

  createAppointment: async (input: CreateAppointmentInput): Promise<Appointment> => {
    const response = await apiClient.post<ApiResponse<Appointment>>("/appointments", input);
    return response.data.data;
  },

  uploadDocument: async (appointmentId: string, file: File): Promise<AppointmentDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiResponse<AppointmentDocument>>(
      getAppointmentDocumentEndpoint(appointmentId),
      formData,
    );
    return response.data.data;
  },
};
