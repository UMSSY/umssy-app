import { ENV_CONFIG } from "@/shared/config/env.config";

export async function deleteVacancy(companyId: string, id: string): Promise<void> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : "";

  const response = await fetch(`${ENV_CONFIG.apiUrl}/companies/${companyId}/job-offers/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Error deleting job vacancy");
  }
}