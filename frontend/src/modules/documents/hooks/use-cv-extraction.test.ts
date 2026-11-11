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
  contact: { firstName: "Juan", lastName: "Pérez", email: "juan@mail.com", phone: null, location: null },
  educations: [
    {
      institution: "UMSS",
      degree: "Licenciatura",
      startDate: "2014-01-01",
      endDate: "2019-01-01",
      description: null,
    },
  ],
  workExperiences: [],
};

describe("useCvExtraction", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("starts closed and empty", () => {
    const { result } = renderHook(() => useCvExtraction());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.extraction).toBeNull();
    expect(result.current.buildDraft()).toBeNull();
  });

  it("opens while the extraction is pending", async () => {
    vi.mocked(documentsService.extractCvData).mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useCvExtraction());

    act(() => result.current.startExtraction("cv-1"));

    await waitFor(() => expect(result.current.isExtracting).toBe(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("selects every detected value once the extraction arrives", async () => {
    vi.mocked(documentsService.extractCvData).mockResolvedValue(EXTRACTION);
    const { result } = renderHook(() => useCvExtraction());

    act(() => result.current.startExtraction("cv-1"));

    await waitFor(() => expect(result.current.extraction).toEqual(EXTRACTION));
    expect(documentsService.extractCvData).toHaveBeenCalledWith("cv-1");
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.selection).toEqual({
      contactFields: ["firstName", "lastName", "email"],
      educations: [0],
      workExperiences: [],
    });
  });

  it("builds the draft from the values the user keeps", async () => {
    vi.mocked(documentsService.extractCvData).mockResolvedValue(EXTRACTION);
    const { result } = renderHook(() => useCvExtraction());
    act(() => result.current.startExtraction("cv-1"));
    await waitFor(() => expect(result.current.extraction).not.toBeNull());

    act(() => {
      result.current.toggleContactField("email");
      result.current.toggleEducation(0);
    });

    expect(result.current.buildDraft()).toEqual({
      cvId: "cv-1",
      contact: { firstName: "Juan", lastName: "Pérez" },
      educations: [],
      workExperiences: [],
    });
  });

  it("keeps the dialog open with the real error message when extraction fails", async () => {
    vi.mocked(documentsService.extractCvData).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useCvExtraction());

    act(() => result.current.startExtraction("cv-1"));

    await waitFor(() =>
      expect(result.current.errorMessage).toBe("No se pudieron leer los datos de tu CV. Intenta de nuevo."),
    );
    expect(result.current.isOpen).toBe(true);
    expect(result.current.extraction).toBeNull();
  });

  it("clears everything when closed", async () => {
    vi.mocked(documentsService.extractCvData).mockResolvedValue(EXTRACTION);
    const { result } = renderHook(() => useCvExtraction());
    act(() => result.current.startExtraction("cv-1"));
    await waitFor(() => expect(result.current.extraction).not.toBeNull());

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.extraction).toBeNull();
    expect(result.current.selection).toEqual({ contactFields: [], educations: [], workExperiences: [] });
  });
});
