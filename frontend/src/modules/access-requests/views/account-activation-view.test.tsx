import "@/shared/testing/indexed-db.mock";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountActivationService } from "../services/account-activation.service";
import { googleAuthService } from "@/modules/auth/services/google-auth.service";
import { AccountActivationView } from "./account-activation-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/modules/auth", () => ({ startSession: vi.fn(), endSession: vi.fn(), resolvePostLoginPath: vi.fn(() => "/community") }));
vi.mock("../services/account-activation.service", () => ({
  accountActivationService: { getStatus: vi.fn(), verifyCode: vi.fn(), activate: vi.fn(), resend: vi.fn() },
}));
vi.mock("@/modules/auth/services/google-auth.service", () => ({
  googleAuthService: {
    promptSelectAccount: vi.fn(),
    linkGoogleAccount: vi.fn((acc, g) =>
      Promise.resolve(
        acc.toLowerCase() === g.toLowerCase()
          ? { success: true }
          : { success: false, reason: "email_mismatch" }
      )
    ),
  },
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

  it("recorre código, contraseña, muestra ¡Cuenta activada! y permite ir a iniciar sesión", async () => {
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

    expect(await screen.findByText("¡Cuenta activada!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vincular con google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ir a iniciar sesión/i })).toBeInTheDocument();
    expect(service.activate).toHaveBeenCalledWith("keyla@gmail.com", "123456", "Abcdefg1");

    await user.click(screen.getByRole("button", { name: /ir a iniciar sesión/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("permite vincular con Google cuando los correos coinciden", async () => {
    vi.mocked(googleAuthService.promptSelectAccount).mockResolvedValue({
      email: "dania@gmail.com",
    });
    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: true, data: { accessToken: "tok", roleTag: "titulado" } });
    render(<AccountActivationView initialEmail="dania@gmail.com" />);

    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));

    await user.click(await screen.findByRole("button", { name: /vincular con google/i }));

    expect(await screen.findByText("Google vinculada")).toBeInTheDocument();
    expect(screen.getByText(/Tu cuenta de Google \(dania@gmail\.com\) quedó vinculada/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ir a iniciar sesión/i })).toBeInTheDocument();
  });

  it("muestra Acceso no permitido cuando el correo de Google no coincide", async () => {
    vi.mocked(googleAuthService.promptSelectAccount).mockResolvedValue({
      email: "otro.usuario@gmail.com",
    });
    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: true, data: { accessToken: "tok", roleTag: "titulado" } });
    render(<AccountActivationView initialEmail="dania@gmail.com" />);

    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));

    await user.click(await screen.findByRole("button", { name: /vincular con google/i }));

    expect(await screen.findByText("Acceso no permitido")).toBeInTheDocument();
    expect(screen.getByText(/Esta cuenta de Google no está registrada en el sistema/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /probar con otra cuenta/i })).toBeInTheDocument();
  });

  it("muestra un mensaje de error y permite reintentar si el servidor falla al vincular", async () => {
    vi.mocked(googleAuthService.promptSelectAccount).mockResolvedValue({
      email: "dania@gmail.com",
    });
    vi.mocked(googleAuthService.linkGoogleAccount).mockResolvedValueOnce({
      success: false,
      reason: "server_error",
      message: "No se pudo conectar con el servidor para vincular la cuenta.",
    });

    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: true, data: { accessToken: "tok", roleTag: "titulado" } });
    render(<AccountActivationView initialEmail="dania@gmail.com" />);

    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));

    await user.click(await screen.findByRole("button", { name: /vincular con google/i }));

    expect(
      await screen.findByText("No se pudo conectar con el servidor para vincular la cuenta.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Google vinculada")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vincular con google/i })).toBeInTheDocument();
  });

  it("no altera el estado si el usuario cancela o cierra el selector de Google", async () => {
    vi.mocked(googleAuthService.promptSelectAccount).mockRejectedValueOnce(
      new Error("User closed prompt")
    );

    service.getStatus.mockResolvedValue({ ok: true, data: readyStatus });
    service.verifyCode.mockResolvedValue({ ok: true, data: {} });
    service.activate.mockResolvedValue({ ok: true, data: { accessToken: "tok", roleTag: "titulado" } });
    render(<AccountActivationView initialEmail="dania@gmail.com" />);

    const user = await typeCode("123456");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.type(await screen.findByLabelText("Contraseña", { selector: "input" }), "Abcdefg1");
    await user.type(screen.getByLabelText("Confirmar contraseña", { selector: "input" }), "Abcdefg1");
    await user.click(screen.getByRole("button", { name: /activar cuenta/i }));

    await user.click(await screen.findByRole("button", { name: /vincular con google/i }));

    expect(await screen.findByText("¡Cuenta activada!")).toBeInTheDocument();
    expect(screen.queryByText("Google vinculada")).not.toBeInTheDocument();
    expect(screen.queryByText("Acceso no permitido")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vincular con google/i })).toBeInTheDocument();
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

  it("muestra la pantalla ¡Cuenta activada! cuando la cuenta ya está activa", async () => {
    service.getStatus.mockResolvedValue({ ok: true, data: { ...readyStatus, state: "activated" } });
    render(<AccountActivationView initialEmail="keyla@gmail.com" />);
    expect(await screen.findByText("¡Cuenta activada!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vincular con google/i })).toBeInTheDocument();
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
  });
});
