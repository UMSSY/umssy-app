import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "../services/documents.service";
import type { CvPage } from "../types/cv-page.types";
import type { SavedCv } from "../types/saved-cv.types";
import { useCvDocument } from "./use-cv-document";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    getCvs: vi.fn(),
    uploadCv: vi.fn(),
    deleteCv: vi.fn(),
  },
}));

const CURRENT_CV: SavedCv = {
  id: "cv-2",
  fileName: "CV-Nuevo.pdf",
  fileType: "PDF",
  sizeInBytes: 1258291,
  updatedAt: new Date("2026-10-04T12:00:00.000Z"),
  isCurrent: true,
};

const OLDER_CV: SavedCv = {
  ...CURRENT_CV,
  id: "cv-1",
  fileName: "CV-Anterior.pdf",
  updatedAt: new Date("2026-10-03T12:00:00.000Z"),
  isCurrent: false,
};

function buildPage(items: SavedCv[], totalItems = items.length): CvPage {
  return { items, totalItems, totalPages: Math.ceil(totalItems / 5), page: 1 };
}

const EMPTY_PAGE = buildPage([]);

describe("useCvDocument", () => {
  beforeEach(() => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(EMPTY_PAGE);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads the five most recent cvs and exposes the current one", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV, OLDER_CV], 7));

    const { result } = renderHook(() => useCvDocument());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(documentsService.getCvs).toHaveBeenCalledWith(1, 5);
    expect(result.current.recentCvs).toEqual([CURRENT_CV, OLDER_CV]);
    expect(result.current.currentCv).toEqual(CURRENT_CV);
    expect(result.current.totalCvs).toBe(7);
    expect(result.current.loadError).toBeNull();
  });

  it("exposes an empty list and no current cv when the user has no cvs", async () => {
    const { result } = renderHook(() => useCvDocument());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recentCvs).toEqual([]);
    expect(result.current.currentCv).toBeNull();
    expect(result.current.totalCvs).toBe(0);
  });

  it("exposes a spanish error when loading fails", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useCvDocument());

    await waitFor(() =>
      expect(result.current.loadError).toBe("No se pudo cargar tu CV. Intenta de nuevo más tarde."),
    );
    expect(result.current.recentCvs).toEqual([]);
  });

  it("ignores the load result after unmounting", async () => {
    let resolveLoad: (page: CvPage) => void = () => undefined;
    vi.mocked(documentsService.getCvs).mockReturnValueOnce(
      new Promise((resolve) => (resolveLoad = resolve)),
    );

    const { result, unmount } = renderHook(() => useCvDocument());
    unmount();

    await act(async () => {
      resolveLoad(buildPage([CURRENT_CV]));
    });

    expect(result.current.recentCvs).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("reloads the list from the server after uploading a cv", async () => {
    const file = new File(["%PDF"], "CV-Nuevo.pdf", { type: "application/pdf" });
    vi.mocked(documentsService.uploadCv).mockResolvedValue(CURRENT_CV);
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV]));

    await act(async () => {
      await result.current.uploadCv(file);
    });

    expect(documentsService.uploadCv).toHaveBeenCalledWith(file);
    await waitFor(() => expect(result.current.currentCv).toEqual(CURRENT_CV));
    await waitFor(() => expect(result.current.isUploading).toBe(false));
  });

  it("clears a previous load error after a successful upload", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValueOnce(new Error("Network Error"));
    vi.mocked(documentsService.uploadCv).mockResolvedValue(CURRENT_CV);
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.loadError).not.toBeNull());
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV]));

    await act(async () => {
      await result.current.uploadCv(new File(["%PDF"], "CV-Nuevo.pdf", { type: "application/pdf" }));
    });

    await waitFor(() => expect(result.current.loadError).toBeNull());
    await waitFor(() => expect(result.current.recentCvs).toEqual([CURRENT_CV]));
  });

  it("keeps the current list when the upload fails", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV]));
    vi.mocked(documentsService.uploadCv).mockRejectedValue({ response: { status: 415 } });
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(
        result.current.uploadCv(new File(["x"], "photo.pdf", { type: "application/pdf" })),
      ).rejects.toEqual({ response: { status: 415 } });
    });

    expect(result.current.recentCvs).toEqual([CURRENT_CV]);
    expect(documentsService.getCvs).toHaveBeenCalledTimes(1);
  });

  it("deletes the chosen cv by id and reloads the list", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV, OLDER_CV]));
    vi.mocked(documentsService.deleteCv).mockResolvedValue(undefined);
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.recentCvs).toHaveLength(2));
    vi.mocked(documentsService.getCvs).mockResolvedValue(
      buildPage([{ ...OLDER_CV, isCurrent: true }]),
    );

    await act(async () => {
      await result.current.deleteCv("cv-2");
    });

    expect(documentsService.deleteCv).toHaveBeenCalledWith("cv-2");
    await waitFor(() =>
      expect(result.current.currentCv).toMatchObject({ id: "cv-1", isCurrent: true }),
    );
    await waitFor(() => expect(result.current.isDeleting).toBe(false));
  });

  it("forgets the downloaded pdf of a deleted cv", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV, OLDER_CV]));
    vi.mocked(documentsService.deleteCv).mockResolvedValue(undefined);
    const { result, client } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.recentCvs).toHaveLength(2));
    client.setQueryData(["documents", "cv-files", "cv-1"], new Blob(["%PDF"]));
    client.setQueryData(["documents", "cv-files", "cv-2"], new Blob(["%PDF"]));

    await act(async () => {
      await result.current.deleteCv("cv-1");
    });

    expect(client.getQueryData(["documents", "cv-files", "cv-1"])).toBeUndefined();
    expect(client.getQueryData(["documents", "cv-files", "cv-2"])).toBeInstanceOf(Blob);
  });

  it("retries loading the list after an error", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.loadError).not.toBeNull());
    vi.mocked(documentsService.getCvs).mockResolvedValue(buildPage([CURRENT_CV]));

    await act(async () => {
      await result.current.reloadCvs();
    });

    await waitFor(() => expect(result.current.loadError).toBeNull());
    expect(result.current.currentCv).toEqual(CURRENT_CV);
    expect(result.current.isReloading).toBe(false);
  });

  it("flags the upload while it is in progress", async () => {
    let resolveUpload: (cv: SavedCv) => void = () => undefined;
    vi.mocked(documentsService.uploadCv).mockReturnValueOnce(
      new Promise((resolve) => (resolveUpload = resolve)),
    );
    const { result } = renderHook(() => useCvDocument());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let upload: Promise<void> = Promise.resolve();
    act(() => {
      upload = result.current.uploadCv(new File(["%PDF"], "CV.pdf", { type: "application/pdf" }));
    });

    await waitFor(() => expect(result.current.isUploading).toBe(true));
    await act(async () => {
      resolveUpload(CURRENT_CV);
      await upload;
    });
    await waitFor(() => expect(result.current.isUploading).toBe(false));
  });
});
