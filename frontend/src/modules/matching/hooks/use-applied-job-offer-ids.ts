"use client";

import { useMemo } from "react";
import { useMyApplications } from "@/modules/applications";
import { getAppliedJobOfferIds } from "../utils/get-applied-job-offer-ids";

export function useAppliedJobOfferIds(): Set<string> {
  const { data } = useMyApplications();
  return useMemo(() => getAppliedJobOfferIds(data), [data]);
}
