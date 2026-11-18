import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NOTIFICATION_PREFERENCES_MESSAGES,
  NOTIFICATION_PUSH_MESSAGES,
} from "../constants/profile-feedback.constants";
import { NotificationPreferencesSection } from "./notification-preferences-section";

type Preferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

const hookMock = vi.hoisted(() => ({
  state: {
    preferences: undefined as Preferences | undefined,
    isLoading: false,
    isError: false,
    isUpdating: false,
    updatePreferences: vi.fn(),
  },
}));

const pushMock = vi.hoisted(() => ({
  environment: "supported" as
    | "supported"
    | "desktop"
    | "ios-old"
    | "ios-not-installed"
    | "unsupported",
  permission: "default" as "default" | "granted" | "denied",
  isSubscribed: false,
  isLoading: false,
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock("../hooks/use-notification-preferences", () => ({
  useNotificationPreferences: () => hookMock.state,
}));

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: () => pushMock,
}));

const DEFAULT_PREFERENCES: Preferences = {
  pushEnabled: false,
  emailEnabled: true,
  inAppEnabled: true,
};

const radio = (name: string) =>
  screen.getByRole("radio", { name: new RegExp(name) });
const saveButton = () =>
  screen.getByRole("button", { name: "Guardar cambios" });
const cancelButton = () => screen.getByRole("button", { name: "Cancelar" });

beforeEach(() => {
  hookMock.state.preferences = DEFAULT_PREFERENCES;
  hookMock.state.isLoading = false;
  hookMock.state.isError = false;
  hookMock.state.isUpdating = false;
  hookMock.state.updatePreferences.mockReset();
  hookMock.state.updatePreferences.mockImplementation(
    async (next: Preferences) => {
      hookMock.state.preferences = next;
    },
  );

  pushMock.environment = "supported";
  pushMock.permission = "default";
  pushMock.isSubscribed = false;
  pushMock.isLoading = false;
  pushMock.activate.mockReset();
  pushMock.activate.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe("NotificationPreferencesSection", () => {
  it("muestra «Solo por correo» en una cuenta nueva y los botones deshabilitados", () => {
    render(<NotificationPreferencesSection />);

    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
  });

  it("muestra la preferencia guardada al volver a entrar", () => {
    hookMock.state.preferences = {
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
    };

    render(<NotificationPreferencesSection />);

    expect(radio("Solo dentro de la app")).toBeChecked();
  });

  it("elegir una opción solo la deja pendiente, sin llamar al backend", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Solo dentro de la app"));

    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeEnabled();
    expect(cancelButton()).toBeEnabled();
    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
  });

  it("«Guardar cambios» envía la preferencia y confirma", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Solo dentro de la app"));
    await user.click(saveButton());

    expect(hookMock.state.updatePreferences).toHaveBeenCalledExactlyOnceWith({
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
    });
    expect(
      await screen.findByText(NOTIFICATION_PREFERENCES_MESSAGES.saved["in-app"]),
    ).toBeInTheDocument();
    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(pushMock.activate).not.toHaveBeenCalled();
  });

  it("«Cancelar» restaura la opción guardada sin llamar al backend", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Solo dentro de la app"));
    await user.click(cancelButton());

    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
  });

  it("si el guardado falla muestra un aviso, conserva la selección y permite reintentar", async () => {
    hookMock.state.updatePreferences.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Solo dentro de la app"));
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      NOTIFICATION_PREFERENCES_MESSAGES.saveError,
    );
    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeEnabled();

    await user.click(saveButton());

    expect(
      await screen.findByText(NOTIFICATION_PREFERENCES_MESSAGES.saved["in-app"]),
    ).toBeInTheDocument();
    expect(hookMock.state.updatePreferences).toHaveBeenCalledTimes(2);
  });

  it("muestra un aviso si no se pueden cargar las preferencias", () => {
    hookMock.state.preferences = undefined;
    hookMock.state.isError = true;

    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      NOTIFICATION_PREFERENCES_MESSAGES.loadError,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("muestra el diálogo de confirmación al guardar Push, sin pedir permiso aún", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());

    expect(
      await screen.findByText(NOTIFICATION_PUSH_MESSAGES.dialog.title),
    ).toBeInTheDocument();
    expect(pushMock.activate).not.toHaveBeenCalled();
    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
  });

  it("activa Push y guarda la preferencia cuando se confirma", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());
    await user.click(
      await screen.findByRole("button", {
        name: NOTIFICATION_PUSH_MESSAGES.dialog.confirm,
      }),
    );

    expect(pushMock.activate).toHaveBeenCalledOnce();
    expect(hookMock.state.updatePreferences).toHaveBeenCalledExactlyOnceWith({
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: false,
    });
    expect(
      await screen.findByText(NOTIFICATION_PREFERENCES_MESSAGES.saved.push),
    ).toBeInTheDocument();
  });

  it("no guarda la preferencia cuando el usuario rechaza el permiso", async () => {
    pushMock.activate.mockResolvedValue({
      ok: false,
      reason: "permission-denied",
    });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());
    await user.click(
      await screen.findByRole("button", {
        name: NOTIFICATION_PUSH_MESSAGES.dialog.confirm,
      }),
    );

    expect(pushMock.activate).toHaveBeenCalledOnce();
    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      NOTIFICATION_PUSH_MESSAGES.permissionDismissed,
    );
    expect(radio("Solo por correo")).toBeChecked();
  });

  it("no guarda la preferencia si falla la suscripción", async () => {
    pushMock.activate.mockResolvedValue({
      ok: false,
      reason: "network-error",
    });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());
    await user.click(
      await screen.findByRole("button", {
        name: NOTIFICATION_PUSH_MESSAGES.dialog.confirm,
      }),
    );

    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      NOTIFICATION_PUSH_MESSAGES.subscriptionError,
    );
  });

  it("cancela el diálogo Push sin activar ni guardar la preferencia", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());
    await user.click(
      await screen.findByRole("button", {
        name: NOTIFICATION_PUSH_MESSAGES.dialog.cancel,
      }),
    );

    expect(pushMock.activate).not.toHaveBeenCalled();
    expect(hookMock.state.updatePreferences).not.toHaveBeenCalled();
    expect(radio("Solo por correo")).toBeChecked();
  });

  it("deshabilita Push cuando el dispositivo no lo soporta", () => {
    pushMock.environment = "desktop";

    render(<NotificationPreferencesSection />);

    expect(radio("Push")).toHaveAttribute("aria-disabled", "true");
  });

  it("indica el estado real de la suscripción cuando Push está guardado", () => {
    hookMock.state.preferences = {
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: false,
    };

    pushMock.isSubscribed = false;
    const { unmount } = render(<NotificationPreferencesSection />);
    expect(
      screen.getByText("No hay una suscripción Push activa en este dispositivo."),
    ).toBeInTheDocument();
    unmount();

    pushMock.isSubscribed = true;
    render(<NotificationPreferencesSection />);
    expect(
      screen.getByText("Las notificaciones Push están activas en este dispositivo."),
    ).toBeInTheDocument();
  });
});