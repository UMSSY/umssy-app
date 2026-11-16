import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { PROFILE_COMPLETENESS_QUERY_KEY } from "@/modules/profile/constants/profile-completeness.constants";
import { CV_QUERY_KEY } from "../constants/cv-api.constants";
import { documentsService } from "../services/documents.service";
import { useSaveCv } from "./use-save-cv";

vi.mock("../services/documents.service", () => ({ documentsService: { uploadCv: vi.fn() } }));

const FILE = new File(["%PDF"], "CV.pdf", { type: "application/pdf" });

describe("useSaveCv", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

  it("cancels old CV loads, saves and invalidates CV history and profile completeness", async () => {
    vi.mocked(documentsService.uploadCv).mockResolvedValue(null);
    const { result, client } = renderHook(() => useSaveCv());
    const cancel = vi.spyOn(client, "cancelQueries");
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => { await result.current.mutateAsync(FILE); });

    expect(cancel).toHaveBeenCalledWith({ queryKey: CV_QUERY_KEY });
    expect(documentsService.uploadCv).toHaveBeenCalledWith(FILE);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CV_QUERY_KEY });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PROFILE_COMPLETENESS_QUERY_KEY });
  });

  it("keeps mutation pending until the upload finishes", async () => {
    let resolveUpload!: (value: null) => void;
    vi.mocked(documentsService.uploadCv).mockReturnValue(new Promise(resolve => { resolveUpload = resolve; }));
    const { result } = renderHook(() => useSaveCv());
    let pending!: ReturnType<typeof result.current.mutateAsync>;
    act(() => { pending = result.current.mutateAsync(FILE); });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await act(async () => { resolveUpload(null); await pending; });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("propagates upload errors and leaves caches unchanged", async () => {
    const error = new Error("Upload failed");
    vi.mocked(documentsService.uploadCv).mockRejectedValue(error);
    const { result, client } = renderHook(() => useSaveCv());
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => { await expect(result.current.mutateAsync(FILE)).rejects.toBe(error); });
    expect(invalidate).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("does not report a saved CV as failed if refreshing the list fails", async () => {
    vi.mocked(documentsService.uploadCv).mockResolvedValue(null);
    const { result, client } = renderHook(() => useSaveCv());
    vi.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Refresh failed"));
    await act(async () => { await expect(result.current.mutateAsync(FILE)).resolves.toBeNull(); });
    expect(result.current.isError).toBe(false);
  });
});
