import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessRequestService } from "../services/access-request.service";
import type {
  ApiResult,
  RequestStatusResponse,
} from "../types/access-request.types";
import { useRequestStatus } from "./use-request-status";

vi.mock("../services/access-request.service", () => ({
  accessRequestService: {
    getRequestStatus: vi.fn(),
  },
}));

const getRequestStatus = vi.mocked(accessRequestService.getRequestStatus);

const REJECTED_REQUEST: RequestStatusResponse = {
  requestCode: "SOL-2026-0001",
  status: "rejected",
  fullName: "Ana Pérez",
  submittedAt: "2026-10-05T15:00:00.000Z",
  reviewedAt: "2026-10-06T10:00:00.000Z",
  rejectionReason: "Documento ilegible",
  document: null,
};

describe("useRequestStatus", () => {
  beforeEach(() => {
    getRequestStatus.mockReset();
  });

  afterEach(cleanup);

  it("inicia sin solicitud, errores ni consulta pendiente", () => {
    const { result } = renderHook(() => useRequestStatus());

    expect(result.current.request).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(getRequestStatus).not.toHaveBeenCalled();
  });

  it("normaliza código y correo y conserva la respuesta recibida", async () => {
    getRequestStatus.mockResolvedValueOnce({
      ok: true,
      data: REJECTED_REQUEST,
    });

    const { result } = renderHook(() => useRequestStatus());

    await act(async () => {
      await result.current.lookupRequest(
        " sol-2026-0001 ",
        " ANA@EJEMPLO.COM ",
      );
    });

    expect(getRequestStatus).toHaveBeenCalledWith(
      "SOL-2026-0001",
      "ana@ejemplo.com",
    );
    expect(result.current.request).toEqual(REJECTED_REQUEST);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isNotFound).toBe(false);
  });

  it.each([
    {
      status: 0,
      message: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    },
    {
      status: 400,
      message: "El código de solicitud no es válido",
    },
    {
      status: 404,
      message: "No se encontró la solicitud",
    },
    {
      status: 500,
      message: "No se pudo completar la solicitud. Inténtalo de nuevo.",
    },
  ])(
    "conserva el mensaje del servicio para el error $status",
    async ({ status, message }) => {
      getRequestStatus.mockResolvedValueOnce({
        ok: false,
        status,
        fieldErrors: {},
        message,
      });

      const { result } = renderHook(() => useRequestStatus());

      await act(async () => {
        await result.current.lookupRequest(
          "SOL-2026-0001",
          "ana@ejemplo.com",
        );
      });

      expect(result.current.request).toBeNull();
      expect(result.current.error).toBe(message);
      expect(result.current.isNotFound).toBe(status === 404);
      expect(result.current.isLoading).toBe(false);
    },
  );

  it("controla una excepción inesperada sin exponer su contenido", async () => {
    getRequestStatus.mockRejectedValueOnce(
      new Error("Detalle interno que no debe mostrarse"),
    );

    const { result } = renderHook(() => useRequestStatus());

    await act(async () => {
      await result.current.lookupRequest(
        "SOL-2026-0001",
        "ana@ejemplo.com",
      );
    });

    expect(result.current.request).toBeNull();
    expect(result.current.error).toBe(
      "No se pudo consultar la solicitud. Inténtalo de nuevo.",
    );
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("mantiene la carga y evita consultas adicionales mientras una está pendiente", async () => {
    const pending =
      Promise.withResolvers<ApiResult<RequestStatusResponse>>();

    getRequestStatus.mockReturnValueOnce(pending.promise);

    const { result } = renderHook(() => useRequestStatus());

    act(() => {
      void result.current.lookupRequest(
        "SOL-2026-0001",
        "ana@ejemplo.com",
      );
      void result.current.lookupRequest(
        "SOL-2026-0001",
        "ana@ejemplo.com",
      );
    });

    expect(result.current.isLoading).toBe(true);
    expect(getRequestStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ ok: true, data: REJECTED_REQUEST });
      await pending.promise;
    });

    expect(result.current.request).toEqual(REJECTED_REQUEST);
    expect(result.current.isLoading).toBe(false);
  });

  it("retira los datos anteriores al iniciar otra consulta que termina en 404", async () => {
    getRequestStatus.mockResolvedValueOnce({
      ok: true,
      data: REJECTED_REQUEST,
    });

    const { result } = renderHook(() => useRequestStatus());

    await act(async () => {
      await result.current.lookupRequest(
        "SOL-2026-0001",
        "ana@ejemplo.com",
      );
    });

    expect(result.current.request).toEqual(REJECTED_REQUEST);

    const pending =
      Promise.withResolvers<ApiResult<RequestStatusResponse>>();

    getRequestStatus.mockReturnValueOnce(pending.promise);

    act(() => {
      void result.current.lookupRequest(
        "SOL-2026-9999",
        "otra@ejemplo.com",
      );
    });

    expect(result.current.request).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      pending.resolve({
        ok: false,
        status: 404,
        fieldErrors: {},
        message: "No se encontró la solicitud",
      });
      await pending.promise;
    });

    expect(result.current.request).toBeNull();
    expect(result.current.error).toBe("No se encontró la solicitud");
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("permite consultar nuevamente después de un error", async () => {
    getRequestStatus.mockResolvedValueOnce({
      ok: false,
      status: 404,
      fieldErrors: {},
      message: "No se encontró la solicitud",
    });

    const { result } = renderHook(() => useRequestStatus());

    await act(async () => {
      await result.current.lookupRequest(
        "SOL-2026-9999",
        "ana@ejemplo.com",
      );
    });

    expect(result.current.isNotFound).toBe(true);

    getRequestStatus.mockResolvedValueOnce({
      ok: true,
      data: REJECTED_REQUEST,
    });

    await act(async () => {
      await result.current.lookupRequest(
        "SOL-2026-0001",
        "ana@ejemplo.com",
      );
    });

    expect(result.current.request).toEqual(REJECTED_REQUEST);
    expect(result.current.error).toBeNull();
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(getRequestStatus).toHaveBeenCalledTimes(2);
  });
});