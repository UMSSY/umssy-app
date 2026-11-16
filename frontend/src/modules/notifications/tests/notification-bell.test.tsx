import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "../components/notification-bell";
import { useNotificationUnreadCount } from "../hooks/use-notification-unread-count";

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

vi.mock("../hooks/use-notification-unread-count", () => ({
  useNotificationUnreadCount: vi.fn(),
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Variante default", () => {
    it("oculta el badge cuando el contador es 0", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      });

      render(<NotificationBell />);

      const link = screen.getByRole("link", { name: "Notificaciones" });
      expect(link).toHaveAttribute("href", "/notifications");
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("muestra el contador exacto cuando hay notificaciones sin leer", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 7,
        isLoading: false,
      });

      render(<NotificationBell />);

      expect(
        screen.getByRole("link", { name: "Notificaciones, 7 sin leer" }),
      ).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("muestra 99+ cuando hay más de 99 notificaciones sin leer", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 145,
        isLoading: false,
      });

      render(<NotificationBell />);

      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });

  describe("Variante floating", () => {
    it("oculta el badge cuando no hay notificaciones sin leer", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      });

      render(<NotificationBell variant="floating" />);

      const link = screen.getByRole("link", { name: "Notificaciones pendientes" });
      expect(link).toHaveAttribute("href", "/notifications");
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("muestra el contador exacto cuando existen avisos sin leer", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 7,
        isLoading: false,
      });

      render(<NotificationBell variant="floating" />);

      expect(
        screen.getByRole("link", { name: "Notificaciones pendientes, 7 sin leer" }),
      ).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("muestra 99+ cuando el contador supera 99", () => {
      vi.mocked(useNotificationUnreadCount).mockReturnValue({
        unreadCount: 120,
        isLoading: false,
      });

      render(<NotificationBell variant="floating" />);

      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });
});