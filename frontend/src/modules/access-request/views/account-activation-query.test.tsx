import { screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { accountActivationService } from "../services/account-activation.service";
import { AccountActivationView } from "./account-activation-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/modules/auth", () => ({ startSession: vi.fn(), resolvePostLoginPath: vi.fn(() => "/community") }));
vi.mock("../services/account-activation.service", () => ({
  accountActivationService: { getStatus: vi.fn(), verifyCode: vi.fn(), activate: vi.fn(), resend: vi.fn() },
}));

const service = vi.mocked(accountActivationService);
const ready = { state: "ready" as const, serverTime: new Date().toISOString(), expiresAt: null, resendAvailableAt: null, resendsRemaining: 3, remainingAttempts: 5 };
const failure = { ok: false as const, status: 503, message: "Servicio no disponible", fieldErrors: {} };

beforeEach(() => { Object.values(service).forEach((fn) => fn.mockReset()); });
afterEach(cleanup);

describe("activación con TanStack Query", () => {
  it("permite recuperar el estado tras un error inicial", async () => {
    service.getStatus.mockResolvedValueOnce(failure).mockResolvedValueOnce({ ok: true, data: ready });
    render(<AccountActivationView initialEmail="test@example.com" />);
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByLabelText("Dígito 1 de 6")).toBeInTheDocument();
    expect(service.getStatus).toHaveBeenCalledTimes(2);
  });

  it("muestra el error del reenvío sin fingir que se envió el código", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: ready });
    service.resend.mockResolvedValue(failure);
    render(<AccountActivationView initialEmail="test@example.com" />);
    await screen.findByLabelText("Dígito 1 de 6");
    await userEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    expect(screen.queryByText(/te enviamos un nuevo código/i)).not.toBeInTheDocument();
    await waitFor(() => expect(service.resend).toHaveBeenCalledOnce());
  });
  it.each(["expired", "locked", "no_code"] as const)("muestra el error de reenvío en estado %s", async (state) => {
    service.getStatus.mockResolvedValue({ ok: true, data: { ...ready, state } });
    service.resend.mockResolvedValue(failure);
    render(<AccountActivationView initialEmail="test@example.com" />);
    await userEvent.click(await screen.findByRole("button", { name: "Enviar un código nuevo" }));
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });

});

