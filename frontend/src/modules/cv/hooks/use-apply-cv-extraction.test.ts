import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "@/modules/profile/services/profile.service";
import { PROFILE_COMPLETENESS_QUERY_KEY } from "@/modules/profile/constants/profile-completeness.constants";
import type { ProfileResponse } from "@/modules/profile";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import { useApplyCvExtraction } from "./use-apply-cv-extraction";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: { updatePresentation: vi.fn() },
}));

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: null, lastName: null, email: null, phone: null, location: null, cityId: null },
  presentation: { headline: "Ingeniera", aboutMe: "Desarrolladora" },
  educations: [],
  workExperiences: [],
  skills: [],
};

const PROFILE: ProfileResponse = {
  id: "user-1",
  firstName: "Ana",
  lastName: "Rojas",
  institutionalEmail: "ana@umss.edu",
  personalEmail: null,
  phone: null,
  city: null,
  headline: "Ingeniera",
  aboutMe: "Desarrolladora",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const SELECTION = { ...CV_EMPTY_EXTRACTION_SELECTION, presentation: [0] };

describe("useApplyCvExtraction", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("applies the selection and refreshes the profile and its completeness", async () => {
    vi.mocked(profileService.updatePresentation).mockResolvedValue(PROFILE);
    const { result, client } = renderHook(() => useApplyCvExtraction());
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      await expect(result.current.apply(EXTRACTION, SELECTION, null)).resolves.toEqual([
        expect.objectContaining({ isApplied: true }),
      ]);
    });

    expect(result.current.report).toEqual({ applied: ["Presentación"], failed: [] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile", "me"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["skills", "profile"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PROFILE_COMPLETENESS_QUERY_KEY });
  });

  it("reports what failed and does not refresh when nothing was applied", async () => {
    vi.mocked(profileService.updatePresentation).mockRejectedValue({ response: { status: 500 } });
    const { result, client } = renderHook(() => useApplyCvExtraction());
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.apply(EXTRACTION, SELECTION, null);
    });

    expect(result.current.report).toEqual({ applied: [], failed: ["Presentación"] });
    expect(invalidate).not.toHaveBeenCalled();

    act(() => result.current.reset());
    expect(result.current.report).toBeNull();
  });
});
