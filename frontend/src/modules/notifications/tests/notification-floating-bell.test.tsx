import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationFloatingBell } from "../components/notification-floating-bell";
import {
  useNotificationsRealtimeSync,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../hooks/use-notifications", () => ({
  useNotificationsRealtimeSync: vi.fn(),
  useUnreadNotificationsCount: vi.fn(),
}));

describe("NotificationFloatingBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("oculta el badge cuando no hay notificaciones sin leer", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 0 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationFloatingBell />);

    const link = screen.getByRole("link", { name: "Notificaciones pendientes" });
    expect(link).toHaveAttribute("href", "/notifications");
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(useNotificationsRealtimeSync).toHaveBeenCalled();
  });

  it("muestra el contador exacto cuando existen avisos sin leer", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 7 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationFloatingBell />);

    expect(
      screen.getByRole("link", { name: "Notificaciones pendientes, 7 sin leer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("muestra 99+ cuando el contador supera 99", () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue({
      data: { count: 120 },
    } as ReturnType<typeof useUnreadNotificationsCount>);

    render(<NotificationFloatingBell />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});