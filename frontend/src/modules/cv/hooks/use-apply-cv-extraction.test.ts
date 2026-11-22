import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { educationsService } from "@/modules/educations/services/educations.service";
import { profileService } from "@/modules/profile/services/profile.service";
import { workExperienceService } from "@/modules/work-experience/services/work-experience.service";
import { PROFILE_COMPLETENESS_QUERY_KEY } from "@/modules/profile/constants/profile-completeness.constants";
import type { ProfileResponse } from "@/modules/profile";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import { useApplyCvExtraction } from "./use-apply-cv-extraction";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: { updatePresentation: vi.fn() },
}));
vi.mock("@/modules/work-experience/services/work-experience.service", () => ({
  workExperienceService: { getWorkExperiences: vi.fn(), createWorkExperience: vi.fn(), updateWorkExperience: vi.fn() },
}));
vi.mock("@/modules/educations/services/educations.service", () => ({
  educationsService: { getEducations: vi.fn(), createEducation: vi.fn(), updateEducation: vi.fn() },
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

const EXPERIENCE = {
  companyName: "AndesSoft Solutions",
  position: "Desarrollador Backend Junior",
  startDate: "2024-01-01",
  endDate: "2026-10-01",
  isCurrent: false,
  description: "Servicios REST",
};

const EXPERIENCE_EXTRACTION: CvExtraction = { ...EXTRACTION, workExperiences: [EXPERIENCE, { ...EXPERIENCE, position: "Analista" }] };

const EXPERIENCE_SELECTION = { ...CV_EMPTY_EXTRACTION_SELECTION, experience: [0, 1] };

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
      await expect(result.current.apply({ extraction: EXTRACTION, selection: SELECTION, profile: null })).resolves.toEqual([
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
      await result.current.apply({ extraction: EXTRACTION, selection: SELECTION, profile: null });
    });

    expect(result.current.report).toEqual({ applied: [], failed: ["Presentación"] });
    expect(invalidate).not.toHaveBeenCalled();

    act(() => result.current.reset());
    expect(result.current.report).toBeNull();
  });

  it("does not create again the records that the profile already has", async () => {
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", ...EXPERIENCE },
    ]);
    vi.mocked(educationsService.getEducations).mockResolvedValue([]);
    vi.mocked(workExperienceService.createWorkExperience).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      ...EXPERIENCE,
      position: "Analista",
    });
    const { result } = renderHook(() => useApplyCvExtraction());

    await act(async () => {
      await result.current.apply({ extraction: EXPERIENCE_EXTRACTION, selection: EXPERIENCE_SELECTION, profile: null });
    });

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledTimes(1);
    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith(expect.objectContaining({ position: "Analista" }));
    expect(workExperienceService.updateWorkExperience).not.toHaveBeenCalled();
    expect(result.current.report?.failed).toEqual([]);
  });

  it("reports the records as not applied when the profile records cannot be loaded", async () => {
    vi.mocked(workExperienceService.getWorkExperiences).mockRejectedValue({ response: { status: 500 } });
    vi.mocked(educationsService.getEducations).mockResolvedValue([]);
    const { result } = renderHook(() => useApplyCvExtraction());

    await act(async () => {
      await result.current.apply({ extraction: EXPERIENCE_EXTRACTION, selection: EXPERIENCE_SELECTION, profile: null });
    });

    expect(workExperienceService.createWorkExperience).not.toHaveBeenCalled();
    expect(result.current.report).toEqual({
      applied: [],
      failed: ["Experiencia laboral: Desarrollador Backend Junior", "Experiencia laboral: Analista"],
    });
  });

  it("keeps applied data successful when a post-save refresh rejects", async () => {
    vi.mocked(profileService.updatePresentation).mockResolvedValue(PROFILE);
    const { result, client } = renderHook(() => useApplyCvExtraction());
    vi.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Refresh unavailable"));

    await act(async () => {
      await expect(result.current.apply({ extraction: EXTRACTION, selection: SELECTION, profile: null })).resolves.toEqual([
        expect.objectContaining({ isApplied: true }),
      ]);
    });

    expect(result.current.report).toEqual({ applied: ["Presentación"], failed: [] });
  });
});
