import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { NotificationPreferenceResponse } from "@/modules/notifications";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import type { PushEnvironment, PushPermissionState } from "@/shared/types/use-push-notifications.types";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { NotificationPreferencesSection } from "./notification-preferences-section";

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: vi.fn(),
}));

vi.mock("../hooks/use-notification-preferences", () => ({
  useNotificationPreferences: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const PUSH = /En el celular \(Push\)/;
const EMAIL = /Solo por correo/;
const IN_APP = /Solo dentro de la app/;

const activate = vi.fn();
const deactivate = vi.fn();
const updatePreferences = vi.fn();

function mockPush(environment: PushEnvironment, permission: PushPermissionState = "default") {
  vi.mocked(usePushNotifications).mockReturnValue({
    environment,
    permission,
    isSubscribed: false,
    isLoading: false,
    activate,
    deactivate,
  });
}

function mockPreferences(preferences?: NotificationPreferenceResponse) {
  vi.mocked(useNotificationPreferences).mockReturnValue({
    preferences,
    isLoading: false,
    isError: false,
    updatePreferences,
    isUpdating: false,
  });
}

describe("NotificationPreferencesSection", () => {
  beforeEach(() => {
    activate.mockResolvedValue({ ok: true });
    deactivate.mockResolvedValue(undefined);
    updatePreferences.mockResolvedValue(undefined);
    mockPreferences();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra las tres opciones con «Solo por correo» elegida por defecto", () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("radio", { name: PUSH })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: EMAIL })).toBeChecked();
    expect(screen.getByRole("radio", { name: IN_APP })).not.toBeChecked();
  });

  it("marca el canal guardado en el backend", () => {
    mockPush("supported");
    mockPreferences({ pushEnabled: false, emailEnabled: false, inAppEnabled: true });
    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("radio", { name: IN_APP })).toBeChecked();
    expect(screen.getByRole("radio", { name: EMAIL })).not.toBeChecked();
  });

  it("guarda la nueva opción al elegir otro canal", async () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: IN_APP }));

    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith({
        pushEnabled: false,
        emailEnabled: false,
        inAppEnabled: true,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Preferencia guardada");
  });

  it("muestra un error y conserva la selección si no se puede guardar", async () => {
    mockPush("supported");
    updatePreferences.mockRejectedValueOnce(new Error("sin red"));
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: IN_APP }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo guardar la preferencia. Inténtalo de nuevo."),
    );
    expect(screen.getByRole("radio", { name: EMAIL })).toBeChecked();
  });

  it("en escritorio deshabilita Push y avisa que está disponible en el celular", () => {
    mockPush("desktop");
    render(<NotificationPreferencesSection />);

    const push = screen.getByRole("radio", { name: PUSH });

    expect(push).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Disponible en tu celular.")).toBeInTheDocument();

    fireEvent.click(push);
    expect(push).not.toBeChecked();
    expect(screen.getByRole("radio", { name: EMAIL })).toBeChecked();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it("en el celular deja Push habilitado y avisa que se pedirá permiso", () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("radio", { name: PUSH })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Te pediremos permiso para activar las alertas.")).toBeInTheDocument();
  });

  it("pide confirmación, activa Push y guarda el canal", async () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: PUSH }));
    const dialog = await screen.findByRole("alertdialog");
    expect(updatePreferences).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(activate).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith({
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: false,
      }),
    );
  });

  it("no guarda Push si el navegador rechaza el permiso", async () => {
    mockPush("supported");
    activate.mockResolvedValueOnce({ ok: false, reason: "permission-denied" });
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: PUSH }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Continuar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Permiso denegado. Habilítalo en la configuración de tu navegador.",
        { id: "push-activation" },
      ),
    );
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it("con el permiso bloqueado avisa sin abrir el diálogo", () => {
    mockPush("supported", "denied");
    render(<NotificationPreferencesSection />);

    fireEvent.click(screen.getByRole("radio", { name: PUSH }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Las notificaciones están bloqueadas. Habilítalas en tu navegador.",
      { id: "push-denied" },
    );
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it("organiza las opciones en columna en móvil y en fila desde escritorio", () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    const group = screen.getByRole("radiogroup", { name: "Canal de notificaciones" });

    expect(group).toHaveClass("flex-col");
    expect(group).toHaveClass("md:flex-row");
  });

  it("recuerda que la campana de la app sigue activa con cualquier opción", () => {
    mockPush("supported");
    render(<NotificationPreferencesSection />);

    expect(screen.getByText("La campana de la app sigue activa con cualquier opción.")).toBeInTheDocument();
  });
});