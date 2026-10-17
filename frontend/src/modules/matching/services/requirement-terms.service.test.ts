import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { REQUIREMENT_TERMS_ENDPOINT } from "../constants/requirement-analysis.constants";
import { requirementTermsService } from "./requirement-terms.service";

vi.mock("@/shared/services/api-client", () => ({ apiClient: { post: vi.fn() } }));

const RESULT = {
  tokens: ["python", "scrum"],
  terms: ["python", "scrum", "python_scrum"],
  skills: ["Python", "Scrum"],
  institutions: [],
};

describe("requirementTermsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía el texto al endpoint de términos y lee response.data.data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "Operación exitosa", data: RESULT },
    });

    await expect(requirementTermsService.analyze("Python y Scrum")).resolves.toEqual(RESULT);
    expect(apiClient.post).toHaveBeenCalledWith(REQUIREMENT_TERMS_ENDPOINT, {
      text: "Python y Scrum",
    });
  });

  it("propaga el error del cliente HTTP", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("fallo de red"));

    await expect(requirementTermsService.analyze("Python")).rejects.toThrow("fallo de red");
  });
});
