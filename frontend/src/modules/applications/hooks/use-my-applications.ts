"use client";

import { useQuery } from "@tanstack/react-query";
import { APPLICATION_QUERY_KEYS } from "../constants/application.constants";
import { applicationService } from "../services/application.service";

export function useMyApplications() {
  return useQuery({
    queryKey: APPLICATION_QUERY_KEYS.mine,
    queryFn: applicationService.getMine,
  });
}
