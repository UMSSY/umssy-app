import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { Appointment } from "../types/appointment.types";
import type { AppointmentScope } from "../types/appointment-scope.types";

export const appointmentsApi = {
  getMyAppointments: async (scope: AppointmentScope): Promise<Appointment[]> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>("/appointments/me", {
      params: { scope },
    });
    return response.data.data;
  },
};
