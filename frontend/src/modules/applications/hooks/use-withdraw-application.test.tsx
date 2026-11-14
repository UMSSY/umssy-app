import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applicationService } from "../services/application.service";
import { useWithdrawApplication } from "./use-withdraw-application";

vi.mock("../services/application.service", () => ({
  applicationService: { withdraw: vi.fn() },
}));

const withdraw = vi.mocked(applicationService.withdraw);

describe("useWithdrawApplication", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("reports which application is being withdrawn while the request is pending", async () => {
    withdraw.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useWithdrawApplication());

    expect(result.current.withdrawingId).toBeNull();

    act(() => result.current.withdraw("application-7"));

    await waitFor(() => expect(result.current.withdrawingId).toBe("application-7"));
  });

  it("flags the failure and withdraws the same application again when retrying", async () => {
    withdraw.mockRejectedValueOnce(new Error("Network Error"));
    withdraw.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWithdrawApplication());

    act(() => result.current.withdraw("application-7"));
    await waitFor(() => expect(result.current.hasWithdrawError).toBe(true));

    act(() => result.current.retryWithdraw());

    await waitFor(() => expect(withdraw).toHaveBeenCalledTimes(2));
    expect(withdraw).toHaveBeenLastCalledWith("application-7");
    await waitFor(() => expect(result.current.hasWithdrawError).toBe(false));
  });

  it("does nothing when there is no failed withdrawal to retry", () => {
    const { result } = renderHook(() => useWithdrawApplication());

    act(() => result.current.retryWithdraw());

    expect(withdraw).not.toHaveBeenCalled();
  });
});
