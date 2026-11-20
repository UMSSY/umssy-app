import { onlineManager } from "@tanstack/react-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { DELETE_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import { COMPANY_ID } from "../testing/vacancy-fixtures";
import { useDeleteJobOffer } from "./use-delete-job-offer";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../services/job-offers.service", () => ({ jobOffersService: { remove: vi.fn() } }));

const VARIABLES = { companyId: COMPANY_ID, jobOfferId: "offer-1" };

describe("useDeleteJobOffer", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("sin conexión deja de cargar y avisa del error", async () => {
    onlineManager.setOnline(false);
    try {
      vi.mocked(jobOffersService.remove).mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
      const { result } = renderHookWithQuery(() => useDeleteJobOffer());

      act(() => result.current.mutate(VARIABLES));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.isPending).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(DELETE_JOB_OFFER_TEXT.error, TOAST_OPTIONS);
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it("elimina, avisa con una notificación arriba y refresca las vacantes de la empresa", async () => {
    vi.mocked(jobOffersService.remove).mockResolvedValue(undefined);
    const { result, client } = renderHookWithQuery(() => useDeleteJobOffer());
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(() => result.current.mutateAsync(VARIABLES));

    expect(jobOffersService.remove).toHaveBeenCalledWith(COMPANY_ID, "offer-1");
    expect(toast.success).toHaveBeenCalledWith(DELETE_JOB_OFFER_TEXT.success, TOAST_OPTIONS);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: JOB_OFFERS_QUERY_KEYS.company(COMPANY_ID) });
  });

  it("muestra el error sin notificar éxito y conserva la lista", async () => {
    vi.mocked(jobOffersService.remove).mockRejectedValue(new Error("HTTP 500"));
    const { result } = renderHookWithQuery(() => useDeleteJobOffer());

    act(() => result.current.mutate(VARIABLES));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(DELETE_JOB_OFFER_TEXT.error, TOAST_OPTIONS);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
