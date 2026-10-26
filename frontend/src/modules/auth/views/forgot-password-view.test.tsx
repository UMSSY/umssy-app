import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ForgotPasswordView } from "./forgot-password-view";
import { authService } from "../services/auth.service";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../services/auth.service", () => ({
  authService: {
    requestPasswordResetCode: vi.fn(),
    verifyPasswordResetCode: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe("ForgotPasswordView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.requestPasswordResetCode).mockResolvedValue({ ok: true });
    vi.mocked(authService.verifyPasswordResetCode).mockResolvedValue({ ok: true });
    vi.mocked(authService.resetPassword).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renderiza el paso 1 con los textos y enlaces iniciales", () => {
    render(<ForgotPasswordView />);

    expect(screen.getByRole("heading", { name: "Recupera tu contraseña" })).toBeInTheDocument();
    expect(screen.getByText("Ingresa el correo con el que te registraste y te enviaremos un código de verificación.")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" })).toBeInTheDocument();
  });

  it("muestra error si se intenta enviar el correo vacío", async () => {
    render(<ForgotPasswordView />);

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    expect(await screen.findByText("Ingresa tu correo electrónico")).toBeInTheDocument();
    expect(authService.requestPasswordResetCode).not.toHaveBeenCalled();
  });

  it("muestra error si el correo tiene un formato inválido", async () => {
    render(<ForgotPasswordView />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "correo-invalido" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    expect(await screen.findByText("Ingresa un correo electrónico válido")).toBeInTheDocument();
    expect(authService.requestPasswordResetCode).not.toHaveBeenCalled();
  });

  it("avanza al paso 2 al enviar un correo válido, muestra el correo enmascarado y vigencia de 5 minutos", async () => {
    render(<ForgotPasswordView />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "estudiante@umss.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    await waitFor(() => {
      expect(authService.requestPasswordResetCode).toHaveBeenCalledWith({ email: "estudiante@umss.edu" });
      expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    });

    expect(screen.getByText(/e\*+@umss\.edu/)).toBeInTheDocument();
    expect(screen.getByText(/Vence en 5 minutos\./)).toBeInTheDocument();
    expect(screen.getByText(/05:00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar correo" })).toBeInTheDocument();
  });

  it("permite volver al paso 1 haciendo clic en 'Cambiar correo'", async () => {
    render(<ForgotPasswordView />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "estudiante@umss.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cambiar correo" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Recupera tu contraseña" })).toBeInTheDocument();
    });
  });

  it("en el paso 2 permite reenviar el código, activa el cooldown de 2 minutos y muestra mensaje", async () => {
    render(<ForgotPasswordView />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "estudiante@umss.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "¿No te llegó? Reenviar código" }));

    await waitFor(() => {
      const msg = screen.getByText(/Código reenviado a e\*+@umss\.edu/);
      expect(msg).toBeInTheDocument();
      expect(msg).toHaveClass("text-accent");
    });

    // Check that button shows cooldown of 2 minutes and is disabled
    expect(screen.getByRole("button", { name: /Reenviar código en (02:00|01:59)/ })).toBeDisabled();
  });

  it("en el paso 2 avanza al paso 3 tras ingresar 6 dígitos y verificar", async () => {
    render(<ForgotPasswordView />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "estudiante@umss.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "123456",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" }));

    await waitFor(() => {
      expect(authService.verifyPasswordResetCode).toHaveBeenCalledWith({
        email: "estudiante@umss.edu",
        code: "123456",
      });
      expect(screen.getByRole("heading", { name: "Crea una nueva contraseña" })).toBeInTheDocument();
    });
  });

  it("en el paso 3 valida coincidencia y requisitos de seguridad de contraseña", async () => {
    render(<ForgotPasswordView />);

    // Step 1
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "estudiante@umss.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO →" }));

    // Step 2
    await waitFor(() => expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument());
    const otpInputs = screen.getAllByRole("textbox");
    fireEvent.paste(otpInputs[0], { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CÓDIGO →" }));

    // Step 3
    await waitFor(() => expect(screen.getByRole("heading", { name: "Crea una nueva contraseña" })).toBeInTheDocument());

    expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Al menos una letra mayúscula")).toBeInTheDocument();
    expect(screen.getByText("Al menos un número")).toBeInTheDocument();

    const newPassInput = screen.getByLabelText("Nueva contraseña");
    const confirmPassInput = screen.getByLabelText("Confirmar contraseña");

    // Passwords do not match
    fireEvent.change(newPassInput, { target: { value: "Segura123" } });
    fireEvent.change(confirmPassInput, { target: { value: "OtraDiferente1" } });

    fireEvent.click(screen.getByRole("button", { name: "GUARDAR CONTRASEÑA →" }));
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();

    // Toggle visibility
    const showBtns = screen.getAllByRole("button", { name: "Mostrar contraseña" });
    fireEvent.click(showBtns[0]);
    expect(newPassInput).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(newPassInput).toHaveAttribute("type", "password");

    // Correct matching password
    fireEvent.change(confirmPassInput, { target: { value: "Segura123" } });
    fireEvent.click(screen.getByRole("button", { name: "GUARDAR CONTRASEÑA →" }));

    // Step 4 Success
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: "estudiante@umss.edu",
        code: "123456",
        password: "Segura123",
      });
      expect(screen.getByRole("heading", { name: "¡Contraseña actualizada!" })).toBeInTheDocument();
      expect(screen.getByText("Ya puedes iniciar sesión con tu nueva contraseña.")).toBeInTheDocument();
    });

    // Clicking "IR A INICIAR SESIÓN →" navigates to /login
    fireEvent.click(screen.getByRole("button", { name: "IR A INICIAR SESIÓN →" }));
    expect(push).toHaveBeenCalledWith("/login");
  });
});