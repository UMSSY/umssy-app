import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { Appointment } from "../types/appointment.types";

export const appointmentsApi = {
  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>("/appointments");
    return response.data.data;
  },
};
