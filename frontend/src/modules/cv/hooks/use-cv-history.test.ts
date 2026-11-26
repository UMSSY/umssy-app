import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import type { SavedCv } from "../types/saved-cv.types";
import { useCvHistory } from "./use-cv-history";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    getCvs: vi.fn(),
    uploadCv: vi.fn(),
    deleteCv: vi.fn(),
  },
}));

const CV: SavedCv = {
  id: "cv-1",
  fileName: "CV-Anterior.pdf",
  fileType: "PDF",
  sizeInBytes: 1024,
  updatedAt: new Date("2026-10-03T12:00:00.000Z"),
  isCurrent: false,
};

describe("useCvHistory", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads the requested page of ten cvs", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue({
      items: [CV],
      totalItems: 11,
      totalPages: 2,
      page: 2,
    });

    const { result } = renderHook(() => useCvHistory(2));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(documentsService.getCvs).toHaveBeenCalledWith(2, 10);
    expect(result.current).toMatchObject({ cvs: [CV], totalCvs: 11, totalPages: 2, loadError: null });
  });

  it("starts empty while loading", () => {
    vi.mocked(documentsService.getCvs).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useCvHistory(1));

    expect(result.current).toMatchObject({ cvs: [], totalCvs: 0, totalPages: 0, isLoading: true });
  });

  it("exposes a spanish error when the history cannot be loaded", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useCvHistory(1));

    await waitFor(() =>
      expect(result.current.loadError).toBe(
        "No se pudo cargar el historial de CVs. Intenta de nuevo más tarde.",
      ),
    );
  });
});
