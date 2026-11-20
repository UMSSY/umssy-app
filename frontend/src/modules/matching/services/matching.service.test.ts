import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { getCompanyApplicants } from "./matching.service";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("matching applicants API", () => {
  it("loads the selected real company and vacancy without a demo fallback", async () => {
    const payload = {
      jobOfferId: "offer-2",
      jobTitle: "Puesto",
      total: 0,
      applicants: [],
    };
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: payload } });
    expect(await getCompanyApplicants("company-2", "offer-2", signal)).toEqual(
      payload,
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      "/companies/company-2/job-offers/offer-2/applications",
      { signal },
    );
  });
  it("propagates authorization errors instead of showing demo applicants", async () => {
    const error = new Error("Forbidden");
    vi.mocked(apiClient.get).mockRejectedValue(error);
    await expect(getCompanyApplicants("other-company", "offer-2")).rejects.toBe(
      error,
    );
  });
});
