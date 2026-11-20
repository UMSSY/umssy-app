import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  CLOSE_JOB_OFFER_TEXT,
  TOAST_OPTIONS,
} from "../constants/job-offers.constants";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { jobOffersService } from "../services/job-offers.service";
import { useCloseJobOffer } from "./use-close-job-offer";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/job-offers.service", () => ({
  jobOffersService: {
    close: vi.fn(),
  },
}));

const COMPANY_ID = "company-1";
const JOB_OFFER_ID = "offer-1";
const variables = {
  companyId: COMPANY_ID,
  jobOfferId: JOB_OFFER_ID,
};

const closed = {
  id: JOB_OFFER_ID,
  status: "Cerrada",
} as Awaited<ReturnType<typeof jobOffersService.close>>;

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const invalidateQueries = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...renderHook(() => useCloseJobOffer(), { wrapper }),
    invalidateQueries,
  };
}

describe("useCloseJobOffer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("cierra la vacante, muestra éxito y actualiza la lista", async () => {
    vi.mocked(jobOffersService.close).mockResolvedValue(closed);

    const { result, invalidateQueries } = setup();

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(jobOffersService.close).toHaveBeenCalledWith(
      COMPANY_ID,
      JOB_OFFER_ID,
    );

    expect(toast.success).toHaveBeenCalledWith(
      CLOSE_JOB_OFFER_TEXT.success,
      expect.objectContaining({
        position: "top-center",
        duration: 5000,
        richColors: true,
        closeButton: true,
        style: expect.objectContaining({
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #bbf7d0",
        }),
      }),
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: JOB_OFFERS_QUERY_KEYS.company(COMPANY_ID),
    });
  });

  it("informa un conflicto 409 y actualiza la lista", async () => {
    vi.mocked(jobOffersService.close).mockRejectedValue({
      response: { status: 409 },
    });

    const { result, invalidateQueries } = setup();

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      CLOSE_JOB_OFFER_TEXT.notClosable,
      TOAST_OPTIONS,
    );

    expect(toast.success).not.toHaveBeenCalled();

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: JOB_OFFERS_QUERY_KEYS.company(COMPANY_ID),
    });
  });

  it("muestra error 500 sin actualizar el estado local", async () => {
    vi.mocked(jobOffersService.close).mockRejectedValue({
      response: { status: 500 },
    });

    const { result, invalidateQueries } = setup();

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      CLOSE_JOB_OFFER_TEXT.server,
      TOAST_OPTIONS,
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("informa un error de conexión sin actualizar la lista", async () => {
    const networkError = Object.assign(new Error("Network Error"), {
      code: "ERR_NETWORK",
    });

    vi.mocked(jobOffersService.close).mockRejectedValue(networkError);

    const { result, invalidateQueries } = setup();

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      CLOSE_JOB_OFFER_TEXT.network,
      TOAST_OPTIONS,
    );

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("expone isPending mientras se procesa el cierre", async () => {
    let resolveRequest:
      | ((value: Awaited<ReturnType<typeof jobOffersService.close>>) => void)
      | undefined;

    vi.mocked(jobOffersService.close).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { result } = setup();

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveRequest?.(closed);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isPending).toBe(false);
  });
});