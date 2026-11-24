import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applicationService } from "../services/application.service";
import { useReactivateApplication } from "./use-reactivate-application";

vi.mock("../services/application.service", () => ({
  applicationService: { reactivate: vi.fn() },
}));

const reactivate = vi.mocked(applicationService.reactivate);

describe("useReactivateApplication", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("reports which application is being reactivated while the request is pending", async () => {
    reactivate.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useReactivateApplication());

    expect(result.current.reactivatingId).toBeNull();

    act(() => result.current.reactivate("application-7"));

    await waitFor(() => expect(result.current.reactivatingId).toBe("application-7"));
  });

  it("flags the failure and clears it when the dialog is opened or closed", async () => {
    reactivate.mockRejectedValueOnce(new Error("Conflict"));
    const { result } = renderHook(() => useReactivateApplication());

    act(() => result.current.reactivate("application-7"));
    await waitFor(() => expect(result.current.hasReactivateError).toBe(true));

    act(() => result.current.resetReactivation());

    await waitFor(() => expect(result.current.hasReactivateError).toBe(false));
  });
});
