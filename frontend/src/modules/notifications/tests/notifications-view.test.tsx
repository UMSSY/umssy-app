import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsView } from "../views/notifications-view";
import {
  useNotificationsInbox,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../hooks/use-notifications", () => ({
  useNotificationsInbox: vi.fn(),
  useUnreadNotificationsCount: vi.fn(),
}));

describe("NotificationsView", () => {
  const markAsReadMock = vi.fn().mockResolvedValue(undefined);
  const markAllAsReadMock = vi.fn().mockResolvedValue(undefined);

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 2 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    vi.mocked(useNotificationsInbox).mockReturnValue({
      notifications: [
        {
          id: "notif-1",
          title: "Nueva encuesta publicada",
          body: "Encuesta de seguimiento a titulados 2026",
          link: "/surveys/123",
          readAt: null,
          createdAt: new Date().toISOString(),
          typeCode: "SURVEY_PUBLISHED",
        },
        {
          id: "notif-2",
          title: "Oferta de mentoría asignada",
          body: "Tienes una nueva oferta de mentoría",
          link: "/mentors/participation",
          readAt: "2026-11-10T10:00:00Z",
          createdAt: "2026-11-10T10:00:00Z",
          typeCode: "MENTOR_SLOT_OFFERED",
        },
      ],
      page: 1,
      limit: 8,
      total: 2,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      markAsRead: markAsReadMock,
      isMarkingAsRead: false,
      markAllAsRead: markAllAsReadMock,
      isMarkingAllAsRead: false,
    });
  });

  it("renderiza el encabezado, filtros, campana flotante y lista de notificaciones", () => {
    render(<NotificationsView />);

    expect(screen.getByRole("heading", { name: "Notificaciones" })).toBeInTheDocument();
    expect(screen.getByText("2 sin leer")).toBeInTheDocument();
    expect(screen.getByText("Nueva encuesta publicada")).toBeInTheDocument();
    expect(screen.getByText("Oferta de mentoría asignada")).toBeInTheDocument();
  });

  it("marca como leída y navega al hacer clic en el botón de acción de un aviso no leído", async () => {
    const user = userEvent.setup();
    render(<NotificationsView />);

    await user.click(screen.getByRole("button", { name: "Responder encuesta" }));

    expect(markAsReadMock).toHaveBeenCalledWith("notif-1");
    expect(pushMock).toHaveBeenCalledWith("/surveys/123");
  });

  it("navega con el filtro seleccionado al cambiar de pestaña", async () => {
    const user = userEvent.setup();
    render(<NotificationsView />);

    await user.click(screen.getByRole("tab", { name: /Notificaciones de Encuestas/i }));

    expect(pushMock).toHaveBeenCalledWith("/notifications?filter=SURVEYS");
  });

  it("ejecuta marcar todas como leídas al presionar el botón superior", async () => {
    const user = userEvent.setup();
    render(<NotificationsView />);

    await user.click(screen.getByRole("button", { name: "Marcar todas como leídas" }));

    expect(markAllAsReadMock).toHaveBeenCalledWith("ALL");
  });
});