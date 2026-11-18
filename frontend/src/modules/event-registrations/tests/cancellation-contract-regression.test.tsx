import "@/shared/testing/indexed-db.mock";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import {
  clearAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { apiClient } from "@/shared/services/api-client";
import { REGISTRATION_QUERY_KEYS } from "../constants/registration-query-keys.constants";
import { useRegistrationActions } from "../hooks/use-registration-actions";
import { registrationsService } from "../services/registrations.service";
import { getRegistrationErrorMessage } from "../utils/registration-error";
import type { RegistrationResponse } from "../types/registration-response.types";

const confirmedRegistration: RegistrationResponse = {
  id: "reg-100",
  eventId: "event-100",
  status: "confirmed",
  qrToken: "f".repeat(64),
  registeredAt: "2026-11-10T10:00:00.000Z",
  cancelledAt: null,
};

const cancelledRegistration: RegistrationResponse = {
  ...confirmedRegistration,
  status: "cancelled",
  cancelledAt: "2026-11-17T11:30:00.000Z",
};

beforeEach(async () => {
  await saveAccessToken("token-egresado-1");
});

afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.restoreAllMocks();
});

describe("Cancellation contract and counter/capacity invalidation regression (HU-08-09 / 09.7)", () => {
  it("parses valid DELETE /event-registrations/:id 200 envelopes and rejects contract violations", async () => {
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Inscripción cancelada",
        data: cancelledRegistration,
      },
    });

    await expect(
      registrationsService.cancel("reg-100", "token-egresado-1"),
    ).resolves.toEqual(cancelledRegistration);
    expect(deleteSpy).toHaveBeenCalledWith("/event-registrations/reg-100", {
      headers: { Authorization: "Bearer token-egresado-1" },
      timeout: 10000,
    });

    deleteSpy.mockResolvedValueOnce({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Inconsistente",
        data: { ...cancelledRegistration, cancelledAt: null },
      },
    });

    await expect(
      registrationsService.cancel("reg-100", "token-egresado-1"),
    ).rejects.toThrow();
  });

  it("maps every backend cancellation rejection code to a specific Spanish message", () => {
    const backendCodes = [
      "REGISTRATION_NOT_OWNED",
      "REGISTRATION_ALREADY_CANCELLED",
      "REGISTRATION_CLOSED",
      "CANCELLATION_NOT_ALLOWED",
      "EVENT_FINISHED",
      "REGISTRATION_NOT_FOUND",
      "EVENT_NOT_OPEN",
      "EVENT_CANCELLED",
    ] as const;

    for (const code of backendCodes) {
      const message = getRegistrationErrorMessage({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            statusCode: 409,
            ok: false,
            code,
            detail: "Internal server message",
            data: null,
          },
        },
      });
      expect(message).not.toBe("No pudimos completar la operación. Inténtalo más tarde.");
      expect(message.length).toBeGreaterThan(10);
    }
  });

  it("invalidates passes counter, event list and event detail queries on successful cancellation", async () => {
    vi.spyOn(registrationsService, "cancel").mockResolvedValue(
      cancelledRegistration,
    );
    const { result, client } = renderHookWithQuery(() =>
      useRegistrationActions("event-100"),
    );
    const ownKey = REGISTRATION_QUERY_KEYS.own(
      "event-100",
      "token-egresado-1",
    );
    client.setQueryData(ownKey, confirmedRegistration);
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    act(() => {
      result.current.cancel("reg-100");
    });

    await waitFor(() =>
      expect(client.getQueryData(ownKey)).toEqual(cancelledRegistration),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: REGISTRATION_QUERY_KEYS.passes,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: REGISTRATION_QUERY_KEYS.list,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: REGISTRATION_QUERY_KEYS.detail("event-100"),
    });
  });

  it("preserves confirmed registration state and avoids false counter invalidation when cancellation fails", async () => {
    vi.spyOn(registrationsService, "cancel").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          statusCode: 409,
          ok: false,
          code: "REGISTRATION_CLOSED",
          detail: "Closed",
          data: null,
        },
      },
    });
    const { result, client } = renderHookWithQuery(() =>
      useRegistrationActions("event-100"),
    );
    const ownKey = REGISTRATION_QUERY_KEYS.own(
      "event-100",
      "token-egresado-1",
    );
    client.setQueryData(ownKey, confirmedRegistration);
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    act(() => {
      result.current.cancel("reg-100");
    });

    await waitFor(() =>
      expect(result.current.error).toBe(
        "El plazo de inscripción y cancelación ha terminado.",
      ),
    );
    expect(client.getQueryData(ownKey)).toEqual(confirmedRegistration);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});