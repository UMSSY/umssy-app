import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import type { PushEnvironment } from "@/shared/types/use-push-notifications.types";
import { NotificationPreferencesSection } from "./notification-preferences-section";

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: vi.fn(),
}));

const PUSH = /En el celular \(Push\)/;
const EMAIL = /Solo por correo/;
const IN_APP = /Solo dentro de la app/;

function mockEnvironment(environment: PushEnvironment) {
  vi.mocked(usePushNotifications).mockReturnValue({
    environment,
    permission: "default",
    isSubscribed: false,
    isLoading: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
  });
}

describe("NotificationPreferencesSection", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra las tres opciones con «Solo por correo» elegida por defecto", () => {
    mockEnvironment("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("radio", { name: PUSH })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: EMAIL })).toBeChecked();
    expect(screen.getByRole("radio", { name: IN_APP })).not.toBeChecked();
  });

  it("cambia la selección al elegir otra opción", () => {
    mockEnvironment("supported");
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: IN_APP }));

    expect(screen.getByRole("radio", { name: IN_APP })).toBeChecked();
    expect(screen.getByRole("radio", { name: EMAIL })).not.toBeChecked();
  });

  it("en escritorio deshabilita Push y avisa que está disponible en el celular", () => {
    mockEnvironment("desktop");
    render(<NotificationPreferencesSection />);

    const push = screen.getByRole("radio", { name: PUSH });

    expect(push).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Disponible en tu celular.")).toBeInTheDocument();

    fireEvent.click(push);
    expect(push).not.toBeChecked();
    expect(screen.getByRole("radio", { name: EMAIL })).toBeChecked();
  });

  it("en el celular deja Push habilitado y avisa que se pedirá permiso", () => {
    mockEnvironment("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("radio", { name: PUSH })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Te pediremos permiso para activar las alertas.")).toBeInTheDocument();
  });

  it("organiza las opciones en columna en móvil y en fila desde escritorio", () => {
    mockEnvironment("supported");
    render(<NotificationPreferencesSection />);

    const group = screen.getByRole("radiogroup", { name: "Canal de notificaciones" });

    expect(group).toHaveClass("flex-col");
    expect(group).toHaveClass("md:flex-row");
  });

  it("recuerda que la campana de la app sigue activa con cualquier opción", () => {
    mockEnvironment("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByText("La campana de la app sigue activa con cualquier opción.")).toBeInTheDocument();
  });
});