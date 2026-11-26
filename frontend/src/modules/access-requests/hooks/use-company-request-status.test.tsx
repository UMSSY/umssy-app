import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { companyAccessRequestService } from "../services/company-access-request.service";
import type { CompanyRequestStatusResponse } from "../types/company-request-status.types";
import { useCompanyRequestStatus } from "./use-company-request-status";

vi.mock("../services/company-access-request.service", () => ({
  companyAccessRequestService: { getPublicStatus: vi.fn() },
}));

const getPublicStatus = vi.mocked(companyAccessRequestService.getPublicStatus);
const OBSERVED: CompanyRequestStatusResponse = {
  requestCode: "EMP-2026-0001",
  companyName: "Tech Andina",
  status: "OBSERVED",
  submittedAt: "2026-11-16T12:00:00.000Z",
  reviewedAt: "2026-11-17T12:00:00.000Z",
  rejectionReason: null,
  reason: "[Documento] Carta ilegible",
  canResubmit: true,
};

describe("useCompanyRequestStatus", () => {
  beforeEach(() => { getPublicStatus.mockReset(); });
  afterEach(cleanup);

  it("consulta con código y correo normalizados y guarda la solicitud", async () => {
    getPublicStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    const { result } = renderHook(() => useCompanyRequestStatus());

    await act(() => result.current.lookupRequest(" emp-2026-0001 ", " Contacto@TechAndina.com "));

    expect(getPublicStatus).toHaveBeenCalledWith("EMP-2026-0001", "contacto@techandina.com");
    expect(result.current.request).toEqual(OBSERVED);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("marca 404 como no encontrada y 429 como límite de intentos", async () => {
    const { result } = renderHook(() => useCompanyRequestStatus());

    getPublicStatus.mockResolvedValue({ ok: false, status: 404, fieldErrors: {}, message: "no" });
    await act(() => result.current.lookupRequest("EMP-2026-0001", "a@b.com"));
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.isRateLimited).toBe(false);
    expect(result.current.error).toContain("No se pudo consultar la solicitud");

    getPublicStatus.mockResolvedValue({ ok: false, status: 429, fieldErrors: {}, message: "no" });
    await act(() => result.current.lookupRequest("EMP-2026-0001", "a@b.com"));
    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.error).toContain("demasiados intentos");
    expect(result.current.request).toBeNull();
  });

  it("un fallo inesperado deja un mensaje genérico y libera la consulta", async () => {
    getPublicStatus.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useCompanyRequestStatus());

    await act(() => result.current.lookupRequest("EMP-2026-0001", "a@b.com"));
    expect(result.current.error).toContain("No se pudo consultar la solicitud");
    expect(result.current.isLoading).toBe(false);

    getPublicStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    await act(() => result.current.lookupRequest("EMP-2026-0001", "a@b.com"));
    expect(result.current.request).toEqual(OBSERVED);
  });

  it("ignora una segunda consulta mientras otra está en curso", async () => {
    let finish: (value: Awaited<ReturnType<typeof getPublicStatus>>) => void = () => undefined;
    getPublicStatus.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useCompanyRequestStatus());

    let first: Promise<void> = Promise.resolve();
    act(() => { first = result.current.lookupRequest("EMP-2026-0001", "a@b.com"); });
    expect(result.current.isLoading).toBe(true);
    await act(() => result.current.lookupRequest("EMP-2026-0001", "a@b.com"));
    expect(getPublicStatus).toHaveBeenCalledTimes(1);

    await act(async () => { finish({ ok: true, data: OBSERVED }); await first; });
    expect(result.current.request).toEqual(OBSERVED);
  });
});
