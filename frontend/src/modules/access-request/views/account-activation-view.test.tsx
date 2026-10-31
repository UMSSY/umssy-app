import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountActivationService } from "../services/account-activation.service";
import { AccountActivationView } from "./account-activation-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/modules/auth", () => ({ startSession: vi.fn(), resolvePostLoginPath: vi.fn(() => "/community") }));
vi.mock("../services/account-activation.service", () => ({
  accountActivationService: { getStatus: vi.fn(), verifyCode: vi.fn(), activate: vi.fn(), resend: vi.fn() },
}));

const service = vi.mocked(accountActivationService);
const now = Date.now();
const readyStatus = {
  state: "ready" as const,
  serverTime: new Date(now).toISOString(),
  expiresAt: new Date(now + 600_000).toISOString(),
  resendAvailableAt: new Date(now + 60_000).toISOString(),
  resendsRemaining: 3,
  remainingAttempts: 5,
};

beforeEach(() => {
  push.mockReset();
  Object.values(service).forEach((fn) => fn.mockReset());
});
afterEach(cleanup);

async function typeCode(code: string) {
  const user = userEvent.setup();
  const first = await screen.findByLabelText("Dígito 1 de 6");
  await user.click(first);
  await user.paste(code);
  return user;
}

describe("AccountActivationView", () => {
  it("pide el correo cuando no viene en la URL", async () => {
    render(<AccountActivationView />);
    expect(await screen.findByLabelText("Correo electrónico")).toBeInTheDocument();
  });

  it("recorre código, contraseña y entra a la comunidad", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: true, data: { accessToken: "tok", roleTag: "titulado" } });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);

    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect(service.verifyCode).toHaveBeenCalledWith("keyla@gmail.com", "123456");

    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(service.activate).toHaveBeenCalledWith("keyla@gmail.com", "123456", "Abcdefg1");
  });

  it("muestra el error de un código incorrecto", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({
      ok: false, status: 400, message: "Código incorrecto. Te quedan 4 intentos.", reason: "code_invalid", remainingAttempts: 4, fieldErrors: {},
    });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);
    const user = await typeCode("000000");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect((await screen.findAllByText(/te quedan 4 intentos/i)).length).toBeGreaterThan(0);
  });

  it("ofrece un código nuevo cuando venció", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: { ...readyStatus, state: "expired", resendAvailableAt: new Date(now - 1000).toISOString() } });
    service.resend.mockResolvedValue({
      ok: true,
      data: { serverTime: readyStatus.serverTime, expiresAt: readyStatus.expiresAt, resendAvailableAt: readyStatus.resendAvailableAt, resendsRemaining: 2 },
    });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /enviar un código nuevo/i }));
    expect(service.resend).toHaveBeenCalledWith("keyla@gmail.com");
    expect(await screen.findByText(/nuevo código/i)).toBeInTheDocument();
  });

  it("avisa cuando la cuenta ya está activa", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: { ...readyStatus, state: "activated" } });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);
    expect(await screen.findByText(/ya está activa/i)).toBeInTheDocument();
  });
  it("muestra la contraseña rechazada por el servidor", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: false, status: 400, message: "Contraseña rechazada", fieldErrors: { password: "Contraseña rechazada" } });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);
    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));
    expect(await screen.findByText("Contraseña rechazada")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

});
