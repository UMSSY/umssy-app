import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import type { CvExtraction } from "../types/cv-extraction.types";
import { useCvExtraction } from "./use-cv-extraction";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    extractCvData: vi.fn(),
  },
}));

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: "Juan", lastName: "Pérez", email: "juan@mail.com", phone: null, location: null, cityId: null },
  presentation: { headline: null, aboutMe: "Ingeniero de sistemas" },
  educations: [
    { institution: "UMSS", degree: "Licenciatura", startDate: "2014-01-01", endDate: "2019-01-01", description: null },
  ],
  workExperiences: [
    {
      companyName: "Empresa SRL",
      position: "Desarrollador",
      startDate: "2021-03-01",
      endDate: null,
      isCurrent: true,
      description: "APIs",
    },
  ],
  skills: [
    { skillId: "skill-ts", name: "TypeScript" },
    { skillId: "skill-sql", name: "SQL" },
  ],
};

const FULL_SELECTION = {
  contact: ["firstName", "lastName", "email"],
  presentation: [0],
  education: [0],
  experience: [0],
  skills: [0, 1],
};

async function renderExtracted(currentHeadline: string | null = "Desarrollador web") {
  vi.mocked(documentsService.extractCvData).mockResolvedValue(EXTRACTION);
  const rendered = renderHook(() => useCvExtraction({ currentHeadline }));
  act(() => rendered.result.current.startExtraction("cv-1"));
  await waitFor(() => expect(rendered.result.current.extraction).not.toBeNull());
  return rendered;
}

describe("useCvExtraction", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("starts closed and empty", () => {
    const { result } = renderHook(() => useCvExtraction());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.extraction).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("opens while the cv is being read", async () => {
    vi.mocked(documentsService.extractCvData).mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useCvExtraction());

    act(() => result.current.startExtraction("cv-1"));

    await waitFor(() => expect(result.current.isExtracting).toBe(true));
    expect(result.current.isOpen).toBe(true);
    expect(documentsService.extractCvData).toHaveBeenCalledWith("cv-1");
  });

  it("selects every detected item and keeps the current headline", async () => {
    const { result } = await renderExtracted();

    expect(result.current.available).toEqual(FULL_SELECTION);
    expect(result.current.selection).toEqual(FULL_SELECTION);
    expect(result.current.extraction?.presentation).toEqual({
      headline: "Desarrollador web",
      aboutMe: "Ingeniero de sistemas",
    });
  });

  it("leaves the headline empty when the profile has none", async () => {
    const { result } = await renderExtracted("   ");

    expect(result.current.extraction?.presentation.headline).toBeNull();
  });

  it("toggles single items and whole sections", async () => {
    const { result } = await renderExtracted();

    act(() => result.current.toggleItem("contact", "email"));
    act(() => result.current.toggleItem("skills", 0));
    expect(result.current.selection.contact).toEqual(["firstName", "lastName"]);
    expect(result.current.selection.skills).toEqual([1]);

    act(() => result.current.toggleSection("contact"));
    expect(result.current.selection.contact).toEqual(["firstName", "lastName", "email"]);

    act(() => result.current.toggleSection("contact"));
    expect(result.current.selection.contact).toEqual([]);
    expect(result.current.available.contact).toEqual(["firstName", "lastName", "email"]);
  });

  it("keeps the corrections made by the user", async () => {
    const { result } = await renderExtracted();

    act(() => result.current.updateContact({ firstName: "Juana", cityId: "city-cbba" }));
    act(() => result.current.updatePresentation({ headline: "Ingeniera" }));
    act(() => result.current.updateEducation(0, { degree: "Ingeniería" }));
    act(() => result.current.updateWorkExperience(0, { isCurrent: false, endDate: "2023-01-01" }));

    expect(result.current.extraction?.contact).toMatchObject({ firstName: "Juana", cityId: "city-cbba" });
    expect(result.current.extraction?.presentation.headline).toBe("Ingeniera");
    expect(result.current.extraction?.educations[0].degree).toBe("Ingeniería");
    expect(result.current.extraction?.workExperiences[0]).toMatchObject({ isCurrent: false, endDate: "2023-01-01" });
    expect(result.current.available.contact).toEqual(["firstName", "lastName", "email"]);
  });

  it("exposes a spanish error when the extraction fails", async () => {
    vi.mocked(documentsService.extractCvData).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useCvExtraction());

    act(() => result.current.startExtraction("cv-1"));

    await waitFor(() =>
      expect(result.current.errorMessage).toBe(
        "El servidor no pudo leer tu CV en este momento. Intenta de nuevo en unos segundos.",
      ),
    );
    expect(result.current.isRetryable).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it("closes and forgets the extraction", async () => {
    const { result } = await renderExtracted();

    act(() => result.current.close());

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(result.current.extraction).toBeNull();
    expect(result.current.selection.skills).toEqual([]);
  });
});
