import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SessionClosedView } from "./session-closed-view";

describe("SessionClosedView", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/session-closed");
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza correctamente los elementos principales y razones por defecto (mockup 2)", () => {
    render(<SessionClosedView />);

    expect(
      screen.getByRole("heading", { name: /tu sesión se cerró/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /ya no podemos mantenerla activa\. inicia sesión de nuevo para continuar\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/puede deberse a que:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/cerraste sesión desde otra pestaña o dispositivo\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no pudimos renovarla por un problema de conexión\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /cambiaste tu contraseña y por seguridad cerramos las demás sesiones\./i,
      ),
    ).toBeInTheDocument();

    const loginButton = screen.getByRole("link", { name: /iniciar sesión/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute("href", "/login");

    const forgotPasswordLink = screen.getByRole("link", {
      name: /cambia tu contraseña/i,
    });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
  });

  it("resalta la razón de otra pestaña cuando reason=SESSION_REVOKED", () => {
    window.history.replaceState({}, "", "/session-closed?reason=SESSION_REVOKED");

    render(<SessionClosedView />);

    const item = screen
      .getByText(/cerraste sesión desde otra pestaña o dispositivo\./i)
      .closest("li");
    expect(item).toHaveClass("font-semibold");
  });

  it("resalta la razón de renovación cuando reason=REFRESH_INVALID", () => {
    window.history.replaceState({}, "", "/session-closed?reason=REFRESH_INVALID");

    render(<SessionClosedView />);

    const item = screen
      .getByText(/no pudimos renovarla por un problema de conexión\./i)
      .closest("li");
    expect(item).toHaveClass("font-semibold");
  });

  it("resalta la razón de contraseña cuando reason=PASSWORD_CHANGED", () => {
    window.history.replaceState({}, "", "/session-closed?reason=PASSWORD_CHANGED");

    render(<SessionClosedView />);

    const item = screen
      .getByText(
        /cambiaste tu contraseña y por seguridad cerramos las demás sesiones\./i,
      )
      .closest("li");
    expect(item).toHaveClass("font-semibold");
  });

  it("muestra y resalta la expiración cuando reason=SESSION_EXPIRED", () => {
    window.history.replaceState({}, "", "/session-closed?reason=SESSION_EXPIRED");

    render(<SessionClosedView />);

    const item = screen.getByText(
      /tu sesión expiró por inactividad o superó el tiempo máximo permitido\./i,
    );
    expect(item).toBeInTheDocument();
    expect(item.closest("li")).toHaveClass("font-semibold");
  });
});
