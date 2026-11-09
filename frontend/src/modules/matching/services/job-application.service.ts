import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import {
  getJobApplicationsEndpoint,
  getMyJobApplicationEndpoint,
} from "../constants/job-application.constants";
import type { JobApplication } from "../types/job-application.types";
import type { MyJobApplication } from "../types/my-job-application.types";

export const jobApplicationService = {
  apply: async (jobOfferId: string): Promise<JobApplication> => {
    const response = await apiClient.post<ApiResponse<JobApplication>>(getJobApplicationsEndpoint(jobOfferId));
    return response.data.data;
  },
  getMine: async (jobOfferId: string): Promise<MyJobApplication> => {
    const response = await apiClient.get<ApiResponse<MyJobApplication>>(getMyJobApplicationEndpoint(jobOfferId));
    return response.data.data;
  },
};
