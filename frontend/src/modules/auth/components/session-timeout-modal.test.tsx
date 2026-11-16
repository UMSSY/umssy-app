import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionTimeoutModal } from "./session-timeout-modal";

describe("SessionTimeoutModal", () => {
  it("renders modal with countdown starting at 03:00 and warning message", () => {
    render(
      <SessionTimeoutModal
        open={true}
        secondsLeft={180}
        onStayConnected={vi.fn()}
        onCloseSession={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /tu sesión está por expirar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /no hemos detectado actividad\. por seguridad, cerraremos tu sesión en:/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("03:00")).toBeInTheDocument();
    expect(
      screen.getByText(
        /si se cierra, los borradores sin guardar se eliminarán de este navegador/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cerrar sesión/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /seguir conectado/i }),
    ).toBeInTheDocument();
  });

  it("calls onStayConnected when clicking Seguir conectado", async () => {
    const handleStayConnected = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionTimeoutModal
        open={true}
        secondsLeft={179}
        onStayConnected={handleStayConnected}
        onCloseSession={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /seguir conectado/i }));
    expect(handleStayConnected).toHaveBeenCalledTimes(1);
  });

  it("calls onCloseSession when clicking Cerrar sesión", async () => {
    const handleCloseSession = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionTimeoutModal
        open={true}
        secondsLeft={90}
        onStayConnected={vi.fn()}
        onCloseSession={handleCloseSession}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));
    expect(handleCloseSession).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and displays loading indicator while refreshing", () => {
    render(
      <SessionTimeoutModal
        open={true}
        secondsLeft={120}
        isRefreshing={true}
        onStayConnected={vi.fn()}
        onCloseSession={vi.fn()}
      />,
    );

    const stayConnectedButton = screen.getByRole("button", {
      name: /renovando/i,
    });
    const closeSessionButton = screen.getByRole("button", {
      name: /cerrar sesión/i,
    });

    expect(stayConnectedButton).toBeDisabled();
    expect(closeSessionButton).toBeDisabled();
  });
});
