import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applicationService } from "../services/application.service";
import { buildApplication } from "../testing/application-fixtures";
import type { ApplicationContact } from "../types/application-contact.types";
import { useContactApplication } from "./use-contact-application";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("../services/application.service", () => ({
  applicationService: { getContact: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const getContact = vi.mocked(applicationService.getContact);

function buildContact(overrides: Partial<ApplicationContact> = {}): ApplicationContact {
  return {
    applicationId: "application-7",
    jobOfferId: "offer-1",
    vacancyTitle: "Desarrollador Backend",
    companyId: "company-1",
    companyName: "TechBolivia S.R.L.",
    recruiters: [{ id: "recruiter-1", fullName: "Ana Rojas" }],
    ...overrides,
  };
}

describe("useContactApplication", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("checks the contact of the application and goes to the chat with the application", async () => {
    getContact.mockResolvedValue(buildContact());
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ id: "application-7" })));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/chat?applicationId=application-7"));
    expect(getContact).toHaveBeenCalledWith("application-7");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("tells that the company has no recruiters available and stays on the page", async () => {
    getContact.mockResolvedValue(buildContact({ recruiters: [] }));
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ id: "application-7" })));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("La empresa todavía no tiene reclutadores disponibles para conversar."),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("reports which application is being contacted while the request is pending", async () => {
    getContact.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useContactApplication());

    expect(result.current.contactingId).toBeNull();

    act(() => result.current.contact(buildApplication({ id: "application-7" })));

    await waitFor(() => expect(result.current.contactingId).toBe("application-7"));
  });

  it("ignores a second request while one is pending", async () => {
    getContact.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ id: "application-7" })));
    await waitFor(() => expect(result.current.contactingId).toBe("application-7"));
    act(() => result.current.contact(buildApplication({ id: "application-8" })));

    expect(getContact).toHaveBeenCalledTimes(1);
  });

  it("warns about the restriction without calling the server when the application is closed", () => {
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ status: "No seleccionado" })));

    expect(toast.error).toHaveBeenCalledWith(
      "Esta postulación ya no permite la comunicación directa con el reclutador.",
    );
    expect(getContact).not.toHaveBeenCalled();
  });

  it("shows the error and stays on the page when the server refuses the contact", async () => {
    getContact.mockRejectedValue({ isAxiosError: true, response: { status: 403 } });
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication()));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Esta postulación ya no permite la comunicación directa con el reclutador.",
      ),
    );
    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.contactingId).toBeNull());
  });

  it("offers to try again when the connection fails and goes to the chat if the retry works", async () => {
    getContact.mockRejectedValueOnce({ isAxiosError: true });
    getContact.mockResolvedValueOnce(buildContact());
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ id: "application-7" })));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No hay conexión a internet. Revisa tu conexión e intenta nuevamente.", {
        action: { label: "Reintentar", onClick: expect.any(Function) },
      }),
    );
    const options = vi.mocked(toast.error).mock.calls[0][1] as unknown as { action: { onClick: () => void } };    await waitFor(() => expect(result.current.contactingId).toBeNull());
    act(() => options.action.onClick());

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/chat?applicationId=application-7"));
    expect(getContact).toHaveBeenCalledTimes(2);
  });

  it("does not offer to try again when the server refuses the contact", async () => {
    getContact.mockRejectedValue({ isAxiosError: true, response: { status: 403 } });
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication()));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0]).toHaveLength(1);
  });

  it("allows contacting again after a failure", async () => {
    getContact.mockRejectedValueOnce(new Error("Network Error"));
    getContact.mockResolvedValueOnce(buildContact());
    const { result } = renderHook(() => useContactApplication());

    act(() => result.current.contact(buildApplication({ id: "application-7" })));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(result.current.contactingId).toBeNull());
    act(() => result.current.contact(buildApplication({ id: "application-7" })));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/chat?applicationId=application-7"));
  });
});
