import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import {
  getJobApplicationsEndpoint,
  getMyJobApplicationEndpoint,
} from "../constants/job-application.constants";
import type { JobApplication } from "../types/job-application.types";
import type { MyJobApplication } from "../types/my-job-application.types";
import type { JobApplicationConsents } from "../types/job-application-consents.types";

export const jobApplicationService = {
  apply: async (
    jobOfferId: string,
    consents: JobApplicationConsents,
  ): Promise<JobApplication> => {
    const response = await apiClient.post<ApiResponse<JobApplication>>(
      getJobApplicationsEndpoint(jobOfferId),
      consents,
    );
    return response.data.data;
  },
  getMine: async (jobOfferId: string): Promise<MyJobApplication> => {
    const response = await apiClient.get<ApiResponse<MyJobApplication>>(
      getMyJobApplicationEndpoint(jobOfferId),
    );
    return response.data.data;
  },
};
