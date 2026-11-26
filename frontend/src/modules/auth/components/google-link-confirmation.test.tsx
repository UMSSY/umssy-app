import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { googleAuthService } from "../services/google-auth.service";
import { startSession } from "../utils/session";
import { GoogleLinkConfirmation } from "./google-link-confirmation";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../utils/session", () => ({ startSession: vi.fn() }));
vi.mock("../services/google-auth.service", () => ({ googleAuthService: { confirmLink: vi.fn() } }));
vi.mock("@/shared/components/layout/brand-logo", () => ({ BrandLogo: () => <span>UMSSY</span> }));

const confirmLink = vi.mocked(googleAuthService.confirmLink);
const link = { linkToken: "link-token", email: "dania@gmail.com", emailVerified: true };
const session = { accessToken: "session-token", roleTag: "titulado" as const, roles: ["titulado" as const] };

function setup(props: { emailVerified?: boolean } = {}) {
  const handlers = { onCancel: vi.fn(), onChooseAnother: vi.fn(), onSessionStarted: vi.fn() };
  render(<GoogleLinkConfirmation link={{ ...link, ...props }} nextPath="/profile" {...handlers} />);
  return handlers;
}

describe("GoogleLinkConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(startSession).mockResolvedValue();
  });
  afterEach(cleanup);

  it("pendiente: muestra el título, el correo de Google y que está verificado", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Vincula tu cuenta de Google" })).toBeInTheDocument();
    expect(screen.getByText("dania@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Verificado por Google")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vincular y continuar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Elegir otra cuenta" })).toBeEnabled();
    expect(confirmLink).not.toHaveBeenCalled();
  });

  it("no afirma la verificación cuando Google no la confirma", () => {
    setup({ emailVerified: false });
    expect(screen.queryByText("Verificado por Google")).not.toBeInTheDocument();
  });

  it("cancelar y elegir otra cuenta avisan al padre sin llamar al servidor", async () => {
    const handlers = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await userEvent.click(screen.getByRole("button", { name: "Elegir otra cuenta" }));
    expect(handlers.onCancel).toHaveBeenCalledOnce();
    expect(handlers.onChooseAnother).toHaveBeenCalledOnce();
    expect(confirmLink).not.toHaveBeenCalled();
  });

  it("vinculando: bloquea los botones mientras espera", async () => {
    let finish: (value: Awaited<ReturnType<typeof confirmLink>>) => void = () => undefined;
    confirmLink.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    setup();

    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));

    expect(await screen.findByRole("button", { name: "Vinculando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Elegir otra cuenta" })).toBeDisabled();
    finish({ success: true, session });
    await screen.findByRole("heading", { name: "¡Bienvenido de nuevo!" });
  });

  it("éxito: abre la sesión, da la bienvenida y «Ir al inicio» navega al destino", async () => {
    confirmLink.mockResolvedValue({ success: true, session });
    const handlers = setup();

    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));

    expect(await screen.findByRole("heading", { name: "¡Bienvenido de nuevo!" })).toBeInTheDocument();
    expect(handlers.onSessionStarted).toHaveBeenCalledOnce();
    expect(startSession).toHaveBeenCalledWith("session-token");
    expect(replace).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    expect(replace).toHaveBeenCalledWith("/profile");
  });

  it("token vencido: pide volver a iniciar con Google y no ofrece reintentar", async () => {
    confirmLink.mockResolvedValue({ success: false, reason: "expired", message: "Vuelve a iniciar con Google" });
    const handlers = setup();

    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vuelve a iniciar con Google");
    expect(screen.queryByRole("button", { name: "Vincular y continuar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Elegir otra cuenta" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Iniciar con Google de nuevo" }));
    expect(handlers.onChooseAnother).toHaveBeenCalledOnce();
  });

  it("correo ya vinculado a otra cuenta: muestra el error y no deja reintentar", async () => {
    confirmLink.mockResolvedValue({
      success: false,
      reason: "already_linked",
      message: "Esta cuenta de Google ya está vinculada a otro usuario.",
    });
    setup();

    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ya está vinculada a otro usuario");
    expect(screen.getByRole("button", { name: "Vincular y continuar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Elegir otra cuenta" })).toBeEnabled();
  });

  it("error del servidor: muestra el error y permite reintentar", async () => {
    confirmLink.mockResolvedValueOnce({ success: false, reason: "server_error", message: "No se pudo vincular la cuenta de Google. Inténtalo de nuevo." });
    setup();

    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo vincular");

    confirmLink.mockResolvedValueOnce({ success: true, session });
    await userEvent.click(screen.getByRole("button", { name: "Vincular y continuar" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "¡Bienvenido de nuevo!" })).toBeInTheDocument());
  });
});
