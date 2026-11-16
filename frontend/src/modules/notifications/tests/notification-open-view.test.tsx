import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { NotificationOpenView } from "../views/notification-open-view";
import { markNotificationAsRead } from "../services/notifications.service";

const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));
vi.mock("../services/notifications.service", () => ({ markNotificationAsRead: vi.fn() }));

function openWith(search: string) {
  window.history.pushState({}, "", `/notifications/open${search}`);
}

function apiError(status: number) {
  return { isAxiosError: true, response: { status } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("NotificationOpenView", () => {
  it("marca el aviso como leído y navega al destino", async () => {
    vi.mocked(markNotificationAsRead).mockResolvedValue();
    openWith("?id=n1&to=%2Fappointments");

    render(<NotificationOpenView />);

    expect(screen.getByRole("status")).toHaveTextContent("Abriendo notificación...");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/appointments"));
    expect(markNotificationAsRead).toHaveBeenCalledWith("n1");
  });

  it("navega aunque el aviso ya no exista y lo informa", async () => {
    vi.mocked(markNotificationAsRead).mockRejectedValue(apiError(404));
    openWith("?id=n1&to=%2Fappointments");

    render(<NotificationOpenView />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/appointments"));
    expect(toast.info).toHaveBeenCalledWith("Esta notificación ya no está disponible.");
  });

  it("no navega si la sesión expiró", async () => {
    vi.mocked(markNotificationAsRead).mockRejectedValue(apiError(401));
    openWith("?id=n1&to=%2Fappointments");

    render(<NotificationOpenView />);

    await waitFor(() => expect(markNotificationAsRead).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });

  it("navega directo cuando el push no trae id", async () => {
    openWith("?to=%2Fchat");

    render(<NotificationOpenView />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/chat"));
    expect(markNotificationAsRead).not.toHaveBeenCalled();
  });
});