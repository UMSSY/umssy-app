import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notificationPreferencesService } from "@/modules/notifications/services/notification-preferences.service";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { NOTIFICATION_PREFERENCES_MESSAGES } from "../constants/profile-feedback.constants";
import { NotificationPreferencesSection } from "./notification-preferences-section";

vi.mock("@/modules/notifications/services/notification-preferences.service", () => ({
  notificationPreferencesService: { get: vi.fn(), update: vi.fn() },
}));

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: () => ({ environment: "supported" }),
}));

const DEFAULT_PREFERENCES = { pushEnabled: false, emailEnabled: true, inAppEnabled: true };

async function renderLoaded() {
  const user = userEvent.setup();
  render(<NotificationPreferencesSection />);
  await screen.findByRole("radiogroup", { name: "Canal de notificaciones" });
  return user;
}

const radio = (name: string) => screen.getByRole("radio", { name: new RegExp(name) });
const saveButton = () => screen.getByRole("button", { name: "Guardar cambios" });
const cancelButton = () => screen.getByRole("button", { name: "Cancelar" });

beforeEach(() => {
  vi.mocked(notificationPreferencesService.get).mockResolvedValue(DEFAULT_PREFERENCES);
  vi.mocked(notificationPreferencesService.update).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NotificationPreferencesSection", () => {
  it("muestra «Solo por correo» en una cuenta nueva y los botones deshabilitados", async () => {
    await renderLoaded();

    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
  });

  it("muestra la preferencia guardada al volver a entrar", async () => {
    vi.mocked(notificationPreferencesService.get).mockResolvedValue({
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
    });
    await renderLoaded();

    expect(radio("Solo dentro de la app")).toBeChecked();
  });

  it("elegir una opción solo la deja pendiente, sin llamar al backend", async () => {
    const user = await renderLoaded();

    await user.click(radio("Solo dentro de la app"));

    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeEnabled();
    expect(cancelButton()).toBeEnabled();
    expect(notificationPreferencesService.update).not.toHaveBeenCalled();
  });

  it("«Guardar cambios» envía el PUT y confirma", async () => {
    const user = await renderLoaded();

    await user.click(radio("Solo dentro de la app"));
    await user.click(saveButton());

    expect(notificationPreferencesService.update).toHaveBeenCalledExactlyOnceWith({
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
    });
    expect(await screen.findByText(NOTIFICATION_PREFERENCES_MESSAGES.saved["in-app"])).toBeInTheDocument();
    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeDisabled();
  });

  it("«Cancelar» descarta lo pendiente y restaura la opción guardada sin llamar al backend", async () => {
    const user = await renderLoaded();

    await user.click(radio("Solo dentro de la app"));
    await user.click(cancelButton());

    expect(radio("Solo por correo")).toBeChecked();
    expect(saveButton()).toBeDisabled();
    expect(notificationPreferencesService.update).not.toHaveBeenCalled();
  });

  it("si el guardado falla muestra un aviso, conserva la selección y permite reintentar", async () => {
    vi.mocked(notificationPreferencesService.update).mockRejectedValueOnce(new Error("boom"));
    const user = await renderLoaded();

    await user.click(radio("Solo dentro de la app"));
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(NOTIFICATION_PREFERENCES_MESSAGES.saveError);
    expect(radio("Solo dentro de la app")).toBeChecked();
    expect(saveButton()).toBeEnabled();

    await user.click(saveButton());

    expect(await screen.findByText(NOTIFICATION_PREFERENCES_MESSAGES.saved["in-app"])).toBeInTheDocument();
    expect(notificationPreferencesService.update).toHaveBeenCalledTimes(2);
  });

  it("muestra un aviso si no se pueden cargar las preferencias", async () => {
    vi.mocked(notificationPreferencesService.get).mockRejectedValue(new Error("boom"));
    render(<NotificationPreferencesSection />);

    expect(await screen.findByRole("alert")).toHaveTextContent(NOTIFICATION_PREFERENCES_MESSAGES.loadError);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });
});