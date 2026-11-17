import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CV_EXPORT_DEFAULT_SECTIONS } from "../constants/cv-export.constants";
import { documentsService } from "../services/documents.service";
import { useCvExport } from "./use-cv-export";

vi.mock("../services/documents.service", () => ({
  documentsService: {
    generateCv: vi.fn(),
  },
}));

const PDF = new Blob(["%PDF"], { type: "application/pdf" });
const FILE_NAME = "CV_Test.pdf";
const FILE_URL = "blob:generated-cv";
const SECTIONS = { ...CV_EXPORT_DEFAULT_SECTIONS, includeCertifications: false };

describe("useCvExport", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue(FILE_URL);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.mocked(documentsService.generateCv).mockResolvedValue({ file: PDF, fileName: FILE_NAME });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("starts without a generated cv", () => {
    const { result } = renderHook(() => useCvExport());

    expect(result.current.generatedCv).toBeNull();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("generates the cv and exposes it with a temporary url", async () => {
    const { result } = renderHook(() => useCvExport());

    let returnedCv: unknown = "not called";
    await act(async () => {
      returnedCv = await result.current.generateCv(SECTIONS);
    });

    expect(returnedCv).toEqual({ file: PDF, previewUrl: FILE_URL, fileName: FILE_NAME });
    expect(documentsService.generateCv).toHaveBeenCalledTimes(1);
    expect(documentsService.generateCv).toHaveBeenCalledWith(SECTIONS);
    expect(URL.createObjectURL).toHaveBeenCalledWith(PDF);
    expect(result.current.generatedCv).toEqual({ file: PDF, previewUrl: FILE_URL, fileName: FILE_NAME });
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
  });

  it("flags the generation while the request is pending", async () => {
    let resolveFile: (result: { file: Blob; fileName: string }) => void = () => undefined;
    vi.mocked(documentsService.generateCv).mockReturnValueOnce(
      new Promise((resolve) => (resolveFile = resolve)),
    );
    const { result } = renderHook(() => useCvExport());

    let generation: Promise<unknown> = Promise.resolve();
    act(() => {
      generation = result.current.generateCv(SECTIONS);
    });

    await waitFor(() => expect(result.current.isGenerating).toBe(true));
    await act(async () => {
      resolveFile({ file: PDF, fileName: FILE_NAME });
      await generation;
    });
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
    expect(result.current.generatedCv?.file).toBe(PDF);
  });

  it("exposes a spanish message when the profile is not found", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useCvExport());

    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    expect(result.current.error).toBe(
      "No encontramos tu perfil. Completa tus datos e intenta de nuevo.",
    );
    expect(result.current.generatedCv).toBeNull();
  });

  it("uses the generic message for a network error", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useCvExport());

    let returnedCv: unknown = "not called";
    await act(async () => {
      returnedCv = await result.current.generateCv(SECTIONS);
    });

    expect(returnedCv).toBeNull();
    expect(result.current.error).toBe("No se pudo generar tu CV. Intenta de nuevo.");
  });

  it("clears the previous error when generating again", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useCvExport());

    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });
    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.generatedCv).toEqual({ file: PDF, previewUrl: FILE_URL, fileName: FILE_NAME });
  });

  it("releases the previous url when generating again", async () => {
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    const { result } = renderHook(() => useCvExport());

    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });
    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(result.current.generatedCv?.previewUrl).toBe("blob:second");
  });

  it("discards the generated cv and releases its url", async () => {
    const { result } = renderHook(() => useCvExport());
    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    act(() => result.current.discardCv());

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FILE_URL);
    expect(result.current.generatedCv).toBeNull();
  });

  it("clears the error when the cv is discarded", async () => {
    vi.mocked(documentsService.generateCv).mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useCvExport());
    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    act(() => result.current.discardCv());

    expect(result.current.error).toBeNull();
  });

  it("ignores a cv that arrives after unmounting", async () => {
    let resolveFile: (result: { file: Blob; fileName: string }) => void = () => undefined;
    vi.mocked(documentsService.generateCv).mockReturnValueOnce(
      new Promise((resolve) => (resolveFile = resolve)),
    );
    const { result, unmount } = renderHook(() => useCvExport());

    let generation: Promise<unknown> = Promise.resolve();
    act(() => {
      generation = result.current.generateCv(SECTIONS);
    });
    unmount();
    resolveFile({ file: PDF, fileName: FILE_NAME });

    await expect(generation).resolves.toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("ignores an error that arrives after unmounting", async () => {
    let rejectFile: (error: unknown) => void = () => undefined;
    vi.mocked(documentsService.generateCv).mockReturnValueOnce(
      new Promise((_resolve, reject) => (rejectFile = reject)),
    );
    const { result, unmount } = renderHook(() => useCvExport());

    let generation: Promise<unknown> = Promise.resolve();
    act(() => {
      generation = result.current.generateCv(SECTIONS);
    });
    unmount();
    rejectFile({ response: { status: 500 } });

    await expect(generation).resolves.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("releases the temporary url when unmounting", async () => {
    const { result, unmount } = renderHook(() => useCvExport());
    await act(async () => {
      await result.current.generateCv(SECTIONS);
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FILE_URL);
  });
});
