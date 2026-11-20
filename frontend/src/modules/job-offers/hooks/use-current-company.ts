"use client";
import { useAuth } from "@/shared/contexts/auth-context";
import { getCurrentCompany } from "../utils/get-current-company";

export function useCurrentCompany() {
  const { company, roles } = useAuth();
  return getCurrentCompany(
    roles.includes("empresa") ? (company ?? null) : null,
  );
}
