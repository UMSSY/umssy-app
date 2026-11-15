import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "../components/notification-bell";
import {
  useNotificationsRealtimeSync,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";

vi.mock("../hooks/use-notifications", () => ({
  useNotificationsRealtimeSync: vi.fn(),
  useUnreadNotificationsCount: vi.fn(),
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oculta el badge cuando el contador es 0", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 0 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationBell />);

    const link = screen.getByRole("link", { name: "Notificaciones" });
    expect(link).toHaveAttribute("href", "/notifications");
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(useNotificationsRealtimeSync).toHaveBeenCalled();
  });

  it("muestra el contador exacto cuando hay notificaciones sin leer", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 7 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationBell />);

    expect(screen.getByRole("link", { name: "Notificaciones, 7 sin leer" })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("muestra 99+ cuando hay más de 99 notificaciones sin leer", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 145 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationBell />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});