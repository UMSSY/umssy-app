import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import type { SavedCv } from "../types/saved-cv.types";
import { useCvViewer } from "./use-cv-viewer";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    getCvs: vi.fn(),
    getCvFile: vi.fn(),
    uploadCv: vi.fn(),
    deleteCv: vi.fn(),
  },
}));

const CV: SavedCv = {
  id: "cv-1",
  fileName: "CV-Test-User.pdf",
  fileType: "PDF",
  sizeInBytes: 1024,
  updatedAt: new Date("2026-10-03T12:00:00.000Z"),
  isCurrent: true,
};

const PDF = new Blob(["%PDF"], { type: "application/pdf" });
const FILE_URL = "blob:cv-1";

describe("useCvViewer", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue(FILE_URL);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.mocked(documentsService.getCvFile).mockResolvedValue(PDF);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("opens the chosen cv with a temporary url", async () => {
    const { result } = renderHook(() => useCvViewer());

    let openError: string | null = "not called";
    await act(async () => {
      openError = await result.current.openCv(CV);
    });

    expect(openError).toBeNull();
    expect(documentsService.getCvFile).toHaveBeenCalledWith("cv-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(PDF);
    expect(result.current.preview).toEqual({ cv: CV, file: PDF, previewUrl: FILE_URL });
    expect(result.current.openingCvId).toBeNull();
  });

  it("reuses the downloaded pdf when the same cv is opened again", async () => {
    const { result } = renderHook(() => useCvViewer());

    await act(async () => {
      await result.current.openCv(CV);
    });
    act(() => result.current.closeCv());
    await act(async () => {
      await result.current.openCv(CV);
    });

    expect(documentsService.getCvFile).toHaveBeenCalledTimes(1);
    expect(result.current.preview?.file).toBe(PDF);
  });

  it("flags the cv being opened", async () => {
    let resolveFile: (file: Blob) => void = () => undefined;
    vi.mocked(documentsService.getCvFile).mockReturnValueOnce(
      new Promise((resolve) => (resolveFile = resolve)),
    );
    const { result } = renderHook(() => useCvViewer());

    let opening: Promise<string | null> = Promise.resolve(null);
    act(() => {
      opening = result.current.openCv(CV);
    });

    await waitFor(() => expect(result.current.openingCvId).toBe("cv-1"));
    await act(async () => {
      resolveFile(PDF);
      await opening;
    });
    expect(result.current.openingCvId).toBeNull();
  });

  it("returns a spanish message when the cv cannot be opened", async () => {
    vi.mocked(documentsService.getCvFile).mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useCvViewer());

    let openError: string | null = null;
    await act(async () => {
      openError = await result.current.openCv(CV);
    });

    expect(openError).toBe("No encontramos tu CV. Recarga la página.");
    expect(result.current.preview).toBeNull();
  });

  it("uses the generic open message for a network error", async () => {
    vi.mocked(documentsService.getCvFile).mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useCvViewer());

    let openError: string | null = null;
    await act(async () => {
      openError = await result.current.openCv(CV);
    });

    expect(openError).toBe("No se pudo abrir el CV. Intenta de nuevo.");
  });

  it("releases the temporary url when closing", async () => {
    const { result } = renderHook(() => useCvViewer());
    await act(async () => {
      await result.current.openCv(CV);
    });

    act(() => {
      result.current.closeCv();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FILE_URL);
    expect(result.current.preview).toBeNull();
  });

  it("releases the previous url when opening another cv", async () => {
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    const { result } = renderHook(() => useCvViewer());

    await act(async () => {
      await result.current.openCv(CV);
    });
    await act(async () => {
      await result.current.openCv({ ...CV, id: "cv-2" });
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(result.current.preview?.previewUrl).toBe("blob:second");
  });

  it("releases the temporary url when unmounting", async () => {
    const { result, unmount } = renderHook(() => useCvViewer());
    await act(async () => {
      await result.current.openCv(CV);
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FILE_URL);
  });

  it("closes without errors when nothing is open", () => {
    const { result } = renderHook(() => useCvViewer());

    act(() => {
      result.current.closeCv();
    });

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});
