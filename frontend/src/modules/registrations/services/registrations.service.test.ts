import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { registrationsService } from "./registrations.service";

import type { RegistrationResponse } from "../types/registration-response.types";

const registration: RegistrationResponse = {
  id: "registration-1",
  eventId: "event-1",
  status: "confirmed",
  qrToken: "qr-token",
  registeredAt: "2026-10-23T12:00:00.000Z",
  cancelledAt: null,
};
const envelope = (statusCode = 200, data = registration) => ({
  statusCode,
  ok: true,
  detail: "Operación exitosa",
  data,
});
const error = (code: string, statusCode = 404) => ({
  isAxiosError: true,
  response: {
    status: statusCode,
    data: { statusCode, ok: false, code, detail: "Detalle", data: null },
  },
});

afterEach(() => vi.restoreAllMocks());

describe("registrations service", () => {
  it("posts without a body through the shared client and captures the session", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: envelope(201) });
    await expect(registrationsService.create("event/1", "captured-token")).resolves.toEqual(registration);
    expect(post).toHaveBeenCalledWith("/events/event%2F1/registrations", undefined, {
      headers: { Authorization: "Bearer captured-token" },
      timeout: 10000,
    });
  });

  it("gets the own record with request cancellation", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: envelope() });
    const signal = new AbortController().signal;
    await expect(registrationsService.getOwn("event/1", signal, "token")).resolves.toEqual(registration);
    expect(get).toHaveBeenCalledWith("/events/event%2F1/registrations/me", {
      headers: { Authorization: "Bearer token" },
      signal,
      timeout: 10000,
    });
  });

  it("returns null only for a typed 404 REGISTRATION_NOT_FOUND", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(error("REGISTRATION_NOT_FOUND"));
    await expect(registrationsService.getOwn("event-1")).resolves.toBeNull();
  });

  it.each([
    error("EVENT_NOT_FOUND"),
    error("REGISTRATION_NOT_FOUND", 500),
    { isAxiosError: true, response: { status: 404 } },
    new Error("Offline"),
  ])("propagates other errors instead of presenting them as no registration", async (cause) => {
    vi.spyOn(apiClient, "get").mockRejectedValue(cause);
    await expect(registrationsService.getOwn("event-1")).rejects.toBe(cause);
  });

  it("returns the cancellation DTO from DELETE 200", async () => {
    const cancelled = { ...registration, status: "cancelled" as const, cancelledAt: registration.registeredAt };
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { ...envelope(), data: cancelled } });
    await expect(registrationsService.cancel("registration/1", null)).resolves.toEqual(cancelled);
    expect(remove).toHaveBeenCalledWith("/registrations/registration%2F1", {
      headers: { Authorization: "" },
      timeout: 10000,
    });
  });

  it.each([
    null,
    { ...envelope(), ok: false },
    { ...envelope(), statusCode: 201 },
    envelope(200, { ...registration, status: "Confirmada" as never }),
    envelope(200, { ...registration, registeredAt: "invalid" }),
    { ...envelope(), data: { ...registration, cancelledAt: "invalid" } },
    envelope(200, { ...registration, status: "cancelled" }),
  ])("rejects a malformed success envelope: %j", async (data) => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data });
    await expect(registrationsService.getOwn("event-1")).rejects.toThrow();
  });

  it("keeps an unauthenticated request from inheriting another session's token", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: envelope(201) });
    await registrationsService.create("event-1", null);
    expect(post.mock.calls[0][2]?.headers).toEqual({ Authorization: "" });
  });
});
