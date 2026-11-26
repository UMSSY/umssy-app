import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { authService } from "../services/auth.service";
import { AuthRequestError } from "../errors/auth-request.error";
import type { CredentialOperation } from "../types/credential-limit.types";
import { ForgotPasswordView } from "./forgot-password-view";
import { LoginView } from "./login-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../hooks/use-redirect-authenticated", () => ({ useRedirectAuthenticated: vi.fn() }));
vi.mock("../utils/session", () => ({ startSession: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../services/auth.service", () => ({ authService: {
  login: vi.fn(), requestPasswordResetCode: vi.fn(), verifyPasswordResetCode: vi.fn(), resetPassword: vi.fn(),
} }));

const MESSAGES = {
  login: "Alcanzaste el límite de intentos para iniciar sesión. Inténtalo más tarde.",
  request: "Has solicitado demasiados códigos en poco tiempo. Inténtalo más tarde.",
  verify: "Alcanzaste el límite de intentos para verificar el código. Inténtalo más tarde.",
  reset: "Has alcanzado el límite para confirmar el cambio. Inténtalo más tarde.",
};
const CODES = {
  login: "LOGIN_ATTEMPTS_LIMIT", request: "PASSWORD_RESET_REQUEST_LIMIT",
  verify: "PASSWORD_RESET_VERIFICATION_LIMIT", reset: "PASSWORD_RESET_CONFIRMATION_LIMIT",
};
let now = 0;

function blocked(operation: CredentialOperation, seconds: number): AuthRequestError {
  return new AuthRequestError(MESSAGES[operation], { status: 429, code: CODES[operation], credentialLimit: {
    code: CODES[operation], operation, retryAfterSeconds: seconds, retryAt: Date.now() + seconds * 1000,
  } });
}

function advance(seconds: number) {
  now += seconds * 1000;
  act(() => { window.dispatchEvent(new Event("focus")); });
}

beforeEach(() => {
  vi.clearAllMocks();
  now = Date.now();
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.mocked(authService.login).mockReset().mockResolvedValue({ accessToken: "token", roleTag: "titulado" });
  vi.mocked(authService.requestPasswordResetCode).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(authService.verifyPasswordResetCode).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(authService.resetPassword).mockReset().mockResolvedValue({ ok: true });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function fillEmail() {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "user@example.test" } });
}
function enterCode() {
  fireEvent.paste(screen.getAllByRole("textbox")[0], { clipboardData: { getData: () => "123456" } });
}
async function requestCode() {
  fillEmail();
  fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));
  await screen.findByRole("heading", { name: "Revisa tu correo" });
}
async function reachReset() {
  await requestCode();
  enterCode();
  fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" }));
  await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "NewPassword1" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "NewPassword1" } });
}

describe("restricciones en inicio de sesión", () => {
  it("bloquea el envío hasta el plazo del servidor y conserva el acceso a recuperación", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(blocked("login", 2));
    renderWithQuery(<LoginView />);
    fillEmail();
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Password1" } });
    const button = screen.getByRole("button", { name: "Iniciar sesión" });
    const form = button.closest("form")!;
    fireEvent.submit(form);
    expect(await screen.findByText(MESSAGES.login)).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute("href", "/forgot-password");
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ChangedPassword1" } });
    fireEvent.submit(form);
    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(screen.getByText(MESSAGES.login)).toBeInTheDocument();
    advance(2);
    expect(button).toBeEnabled();
    expect(screen.queryByText(MESSAGES.login)).not.toBeInTheDocument();
    fireEvent.submit(form);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(authService.login).toHaveBeenCalledTimes(2);
  });

  it("conserva el bloqueo al volver al mismo correo con mayúsculas", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(blocked("login", 900));
    renderWithQuery(<LoginView />);
    fillEmail();
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await screen.findByText(MESSAGES.login);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "other@example.test" } });
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "USER@EXAMPLE.TEST" } });
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  });

  it("no duplica la petición mientras hay un inicio de sesión pendiente", async () => {
    let resolve!: (value: { accessToken: string; roleTag: "titulado" }) => void;
    vi.mocked(authService.login).mockImplementation(() => new Promise((done) => { resolve = done; }));
    renderWithQuery(<LoginView />);
    fillEmail();
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Password1" } });
    const form = screen.getByRole("button", { name: "Iniciar sesión" }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
    await act(async () => { resolve({ accessToken: "token", roleTag: "titulado" }); });
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  });
});

describe("restricciones en recuperación", () => {
  it("mantiene la cuota por correo, permite otra cuenta y habilita el envío al vencer", async () => {
    vi.mocked(authService.requestPasswordResetCode).mockRejectedValueOnce(blocked("request", 30));
    renderWithQuery(<ForgotPasswordView />);
    fillEmail();
    const button = screen.getByRole("button", { name: "ENVIAR CÓDIGO →" });
    const form = button.closest("form")!;
    fireEvent.submit(form);
    await screen.findByText(MESSAGES.request);
    expect(button).toBeDisabled();
    fireEvent.submit(form);
    expect(authService.requestPasswordResetCode).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "other@example.test" } });
    expect(button).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "USER@EXAMPLE.TEST" } });
    expect(button).toBeDisabled();
    expect(screen.getByText(MESSAGES.request)).toBeInTheDocument();
    advance(30);
    expect(button).toBeEnabled();
    expect(screen.queryByText(MESSAGES.request)).not.toBeInTheDocument();
    fireEvent.submit(form);
    await screen.findByRole("heading", { name: "Revisa tu correo" });
  });

  it("espera dos minutos desde el primer envío y una cuota de reenvío no bloquea verificar", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await requestCode();
    expect(screen.getByRole("button", { name: /Reenviar código en 02:00/ })).toBeDisabled();
    advance(120);
    const resend = screen.getByRole("button", { name: "¿No te llegó? Reenviar código" });
    expect(resend).toBeEnabled();
    vi.mocked(authService.requestPasswordResetCode).mockRejectedValueOnce(blocked("request", 900));
    fireEvent.click(resend);
    await screen.findByText(MESSAGES.request);
    expect(screen.getByRole("button", { name: /Reenviar código en/ })).toBeDisabled();
    enterCode();
    const verify = screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" });
    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
  });

  it("reenviar no borra el bloqueo de verificación ni prolonga la vigencia del código anterior", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await requestCode();
    vi.mocked(authService.verifyPasswordResetCode).mockRejectedValueOnce(blocked("verify", 900));
    enterCode();
    const verify = screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" });
    fireEvent.click(verify);
    await screen.findByText(MESSAGES.verify);
    expect(verify).toBeDisabled();
    fireEvent.submit(verify.closest("form")!);
    expect(authService.verifyPasswordResetCode).toHaveBeenCalledTimes(1);
    advance(120);
    fireEvent.click(screen.getByRole("button", { name: "¿No te llegó? Reenviar código" }));
    await screen.findByText(/Código reenviado a/);
    expect(screen.getByText(MESSAGES.verify)).toBeInTheDocument();
    expect(verify).toBeDisabled();
    advance(780);
    expect(screen.queryByText(MESSAGES.verify)).not.toBeInTheDocument();
    expect(screen.getByText("El código ha expirado. Por favor, solicita uno nuevo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "¿No te llegó? Reenviar código" })).toBeEnabled();
    expect(verify).toBeDisabled();
  });

  it("libera la verificación al vencer su plazo si el código todavía está vigente", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await requestCode();
    vi.mocked(authService.verifyPasswordResetCode).mockRejectedValueOnce(blocked("verify", 2));
    enterCode();
    const verify = screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" });
    fireEvent.click(verify);
    await screen.findByText(MESSAGES.verify);
    advance(2);
    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
    expect(authService.verifyPasswordResetCode).toHaveBeenCalledTimes(2);
  });

  it("retiene la contraseña durante un bloqueo y muestra éxito solo al confirmar el servidor", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await reachReset();
    vi.mocked(authService.resetPassword).mockRejectedValueOnce(blocked("reset", 2));
    const save = screen.getByRole("button", { name: "GUARDAR CONTRASEÑA →" });
    const form = save.closest("form")!;
    fireEvent.submit(form);
    await screen.findByText(MESSAGES.reset);
    expect(save).toBeDisabled();
    expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("NewPassword1");
    fireEvent.submit(form);
    expect(authService.resetPassword).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "¡Contraseña actualizada!" })).not.toBeInTheDocument();
    advance(2);
    expect(save).toBeEnabled();
    fireEvent.submit(form);
    await screen.findByRole("heading", { name: "¡Contraseña actualizada!" });
    expect(authService.resetPassword).toHaveBeenCalledTimes(2);
  });

  it("muestra el rechazo de una contraseña sin presentar una confirmación falsa", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await reachReset();
    vi.mocked(authService.resetPassword).mockRejectedValueOnce(new Error("Elige una contraseña que no hayas usado antes."));
    fireEvent.click(screen.getByRole("button", { name: "GUARDAR CONTRASEÑA →" }));
    await screen.findByText("Elige una contraseña que no hayas usado antes.");
    expect(screen.queryByRole("heading", { name: "¡Contraseña actualizada!" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Solicitar un nuevo código/ })).not.toBeInTheDocument();
  });

  it("no pierde el bloqueo de verificación al volver y solicitar otro código para el mismo correo", async () => {
    renderWithQuery(<ForgotPasswordView />);
    await requestCode();
    vi.mocked(authService.verifyPasswordResetCode).mockRejectedValueOnce(blocked("verify", 900));
    enterCode();
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" }));
    await screen.findByText(MESSAGES.verify);
    advance(120);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar correo" }));
    await screen.findByRole("heading", { name: "Recupera tu contraseña" });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));
    await screen.findByRole("heading", { name: "Revisa tu correo" });
    expect(screen.getByText(MESSAGES.verify)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" })).toBeDisabled();
  });
});
