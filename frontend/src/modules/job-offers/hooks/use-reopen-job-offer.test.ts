import { AxiosError, type AxiosResponse } from "axios";
import { act, cleanup, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { REOPEN_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import { buildJobOffer, COMPANY_ID } from "../testing/vacancy-fixtures";
import { useReopenJobOffer } from "./use-reopen-job-offer";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../services/job-offers.service", () => ({ jobOffersService: { reopen: vi.fn() } }));

const VARIABLES = { companyId: COMPANY_ID, jobOfferId: "closed" };

describe("useReopenJobOffer", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("reabre, avisa y refresca las vacantes de la empresa", async () => {
    vi.mocked(jobOffersService.reopen).mockResolvedValue(buildJobOffer({ id: "closed" }));
    const { result, client } = renderHookWithQuery(() => useReopenJobOffer());
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(() => result.current.mutateAsync(VARIABLES));

    expect(jobOffersService.reopen).toHaveBeenCalledWith(COMPANY_ID, "closed");
    expect(toast.success).toHaveBeenCalledWith(REOPEN_JOB_OFFER_TEXT.success, TOAST_OPTIONS);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: JOB_OFFERS_QUERY_KEYS.company(COMPANY_ID) });
  });

  it("si la vacante cambió de estado avisa sin mostrar éxito", async () => {
    vi.mocked(jobOffersService.reopen).mockRejectedValue(
      new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, { status: 409, data: {} } as AxiosResponse),
    );
    const { result } = renderHookWithQuery(() => useReopenJobOffer());

    act(() => result.current.mutate(VARIABLES));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(REOPEN_JOB_OFFER_TEXT.notReopenable, TOAST_OPTIONS);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
