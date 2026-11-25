import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NOTIFICATION_PREFERENCES_MESSAGES,
  NOTIFICATION_PUSH_MESSAGES,
} from "../constants/profile-feedback.constants";
import {
  PUSH_GUIDE_CLOSE_LABEL,
  PUSH_GUIDES,
  PUSH_PERMISSION_PROMPT,
} from "@/shared/constants/push-permission.constants";
import { NotificationPreferencesSection } from "./notification-preferences-section";

type Channel = "push" | "email" | "in-app";

const hookMock = vi.hoisted(() => ({
  state: {
    savedChannel: null as Channel | null,
    isLoading: false,
    loadError: false,
    isSaving: false,
    saveChannel: vi.fn(),
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
  sync: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock("@/modules/notifications/hooks/use-notification-preferences", () => ({
  useNotificationPreferences: () => hookMock.state,
}));

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: () => pushMock,
}));

const radio = (name: string) =>
  screen.getByRole("radio", { name: new RegExp(name) });
const saveButton = () =>
  screen.getByRole("button", { name: "Guardar cambios" });
const cancelButton = () => screen.getByRole("button", { name: "Cancelar" });

beforeEach(() => {
  hookMock.state.savedChannel = "email";
  hookMock.state.isLoading = false;
  hookMock.state.loadError = false;
  hookMock.state.isSaving = false;
  hookMock.state.saveChannel.mockReset();
  hookMock.state.saveChannel.mockImplementation(async (next: Channel) => {
    hookMock.state.savedChannel = next;
  });

  pushMock.environment = "supported";
  pushMock.permission = "default";
  pushMock.isSubscribed = false;
  pushMock.isLoading = false;
  pushMock.activate.mockReset();
  pushMock.activate.mockImplementation(async () => {
    pushMock.isSubscribed = true;
    return { ok: true };
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NotificationPreferencesSection", () => {
  it("muestra «Solo por correo» en una cuenta nueva y los botones deshabilitados", () => {
    render(<NotificationPreferencesSection />);

    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
  });

  it("muestra la preferencia guardada al volver a entrar", () => {
    hookMock.state.savedChannel = "in-app";

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
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
  });

  it("«Guardar cambios» envía la preferencia y confirma", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Solo dentro de la app"));
    await user.click(saveButton());

    expect(hookMock.state.saveChannel).toHaveBeenCalledExactlyOnceWith("in-app");
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
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
  });

  it("si el guardado falla muestra un aviso, conserva la selección y permite reintentar", async () => {
    hookMock.state.saveChannel.mockRejectedValueOnce(new Error("boom"));
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
    expect(hookMock.state.saveChannel).toHaveBeenCalledTimes(2);
  });

  it("muestra un aviso si no se pueden cargar las preferencias", () => {
    hookMock.state.savedChannel = null;
    hookMock.state.loadError = true;

    render(<NotificationPreferencesSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      NOTIFICATION_PREFERENCES_MESSAGES.loadError,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("al seleccionar Push muestra el aviso propio de UMSSY sin pedir permiso aún (HU-15 CA-U1)", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));

    expect(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.dismiss })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm })).toBeInTheDocument();
    expect(pushMock.activate).not.toHaveBeenCalled();
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
  });

  it("«Ahora no» conserva la preferencia guardada (HU-16)", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.dismiss }));

    expect(pushMock.activate).not.toHaveBeenCalled();
    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
  });

  it("«Continuar» pide permiso y suscribe; luego «Guardar cambios» guarda Push", async () => {
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm }));

    expect(pushMock.activate).toHaveBeenCalledOnce();
    expect(await screen.findByText(NOTIFICATION_PUSH_MESSAGES.permissionGranted)).toBeInTheDocument();
    expect(radio("Push")).toBeChecked();

    await user.click(saveButton());

    expect(hookMock.state.saveChannel).toHaveBeenCalledExactlyOnceWith("push");
  });

  it("si el usuario bloquea el permiso muestra la guía y conserva la preferencia (HU-15 CA-U3, HU-16)", async () => {
    pushMock.activate.mockResolvedValue({ ok: false, reason: "permission-blocked" });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm }));

    expect(await screen.findByText(PUSH_GUIDES.blocked.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: PUSH_GUIDE_CLOSE_LABEL }));
    expect(radio("Solo por correo")).toBeChecked();
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
  });

  it("si el usuario cierra el diálogo nativo informa y conserva la preferencia", async () => {
    pushMock.activate.mockResolvedValue({ ok: false, reason: "permission-dismissed" });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(NOTIFICATION_PUSH_MESSAGES.permissionDismissed);
    expect(radio("Solo por correo")).toBeChecked();
  });

  it("si falla la suscripción informa y conserva la preferencia", async () => {
    pushMock.activate.mockResolvedValue({ ok: false, reason: "network-error" });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm }));

    expect(await screen.findByRole("alert")).toHaveTextContent(NOTIFICATION_PUSH_MESSAGES.subscriptionError);
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
  });

  it("con el permiso ya bloqueado muestra la guía sin abrir el aviso ni el diálogo nativo (HU-15 CA-U4)", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));

    expect(await screen.findByText(PUSH_GUIDES.blocked.title)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm })).not.toBeInTheDocument();
    expect(pushMock.activate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: PUSH_GUIDE_CLOSE_LABEL }));
    expect(radio("Solo por correo")).toBeChecked();
  });

  it.each([
    ["ios-old", PUSH_GUIDES["ios-old"].title],
    ["ios-not-installed", PUSH_GUIDES["ios-not-installed"].title],
  ] as const)("en iPhone %s muestra la guía correspondiente (HU-15 CA-U5)", async (environment, title) => {
    pushMock.environment = environment;
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(pushMock.activate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: PUSH_GUIDE_CLOSE_LABEL }));
    expect(radio("Solo por correo")).toBeChecked();
  });

  it("deshabilita Push en escritorio (HU-16)", () => {
    pushMock.environment = "desktop";

    render(<NotificationPreferencesSection />);

    expect(radio("Push")).toHaveAttribute("aria-disabled", "true");
  });

  it("indica el estado real de la suscripción cuando Push está guardado", () => {
    hookMock.state.savedChannel = "push";

    pushMock.isSubscribed = false;
    const { unmount } = render(<NotificationPreferencesSection />);
    expect(screen.getByText(NOTIFICATION_PUSH_MESSAGES.noDeviceSubscription)).toBeInTheDocument();
    unmount();

    pushMock.isSubscribed = true;
    render(<NotificationPreferencesSection />);
    expect(screen.getByText(NOTIFICATION_PUSH_MESSAGES.deviceSubscriptionActive)).toBeInTheDocument();
  });

  it("permite reactivar Push en este dispositivo sin volver a guardar la preferencia (HU-15)", async () => {
    hookMock.state.savedChannel = "push";
    pushMock.isSubscribed = false;
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(screen.getByRole("button", { name: NOTIFICATION_PUSH_MESSAGES.activateOnDevice }));
    await user.click(await screen.findByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm }));

    expect(pushMock.activate).toHaveBeenCalledOnce();
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
    expect(await screen.findByText(NOTIFICATION_PUSH_MESSAGES.deviceActivated)).toBeInTheDocument();
  });

  it("con una suscripción del navegador ya existente, registra el dispositivo en la cuenta antes de guardar Push", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    pushMock.isSubscribed = true;
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));

    expect(screen.queryByRole("button", { name: PUSH_PERMISSION_PROMPT.confirm })).not.toBeInTheDocument();

    await user.click(saveButton());

    expect(pushMock.activate).toHaveBeenCalledOnce();
    expect(hookMock.state.saveChannel).toHaveBeenCalledExactlyOnceWith("push");
    expect(pushMock.activate.mock.invocationCallOrder[0]).toBeLessThan(
      hookMock.state.saveChannel.mock.invocationCallOrder[0],
    );
  });

  it("si el registro del dispositivo falla al guardar, no guarda Push", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    pushMock.isSubscribed = true;
    pushMock.activate.mockResolvedValue({ ok: false, reason: "network-error" });
    const user = userEvent.setup();
    render(<NotificationPreferencesSection />);

    await user.click(radio("Push"));
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(NOTIFICATION_PUSH_MESSAGES.subscriptionError);
    expect(hookMock.state.saveChannel).not.toHaveBeenCalled();
    expect(radio("Solo por correo")).toBeChecked();
  });
});
