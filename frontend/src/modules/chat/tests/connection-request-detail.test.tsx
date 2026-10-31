
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { ConnectionRequestDetail } from "../components/connection-request-detail";
import type { ConnectionRequest } from "../types/connection-request.types";

const request: ConnectionRequest = {
  id: "request-1",
  senderId: "user-1",
  receiverId: "user-2",
  statusId: "status-pending",
  createdAt: "2026-10-28T12:00:00.000Z",
  updatedAt: "2026-10-28T12:00:00.000Z",
  status: {
    id: "status-pending",
    title: "PENDING",
  },
  sender: {
    id: "user-1",
    firstName: "Juan",
    lastName: "Pérez",
    headline: "Estudiante de Ingeniería",
    isActive: true,
  },
};

afterEach(() => {
  cleanup();
});

describe("ConnectionRequestDetail", () => {
  it("muestra los datos del remitente", () => {
    render(
      <ConnectionRequestDetail
        request={request}
        onBack={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Juan Pérez",
        level: 2,
      }),
    ).toBeTruthy();

    expect(
      screen.getByText("Estudiante de Ingeniería"),
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Te ha enviado una solicitud de conexión",
      ),
    ).toBeTruthy();
  });

  it("permite aceptar una solicitud", () => {
    const onAccept = vi.fn();

    render(
      <ConnectionRequestDetail
        request={request}
        onBack={vi.fn()}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /aceptar/i,
      }),
    );

    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("permite rechazar una solicitud", () => {
    const onReject = vi.fn();

    render(
      <ConnectionRequestDetail
        request={request}
        onBack={vi.fn()}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /rechazar/i,
      }),
    );

    expect(onReject).toHaveBeenCalledOnce();
  });

  it("deshabilita los botones mientras procesa", () => {
    render(
      <ConnectionRequestDetail
        request={request}
        onBack={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        isResponding
      />,
    );

    const acceptButton = screen.getByRole("button", {
      name: /procesando/i,
    }) as HTMLButtonElement;

    const rejectButton = screen.getByRole("button", {
      name: /rechazar/i,
    }) as HTMLButtonElement;

    expect(acceptButton.disabled).toBe(true);
    expect(rejectButton.disabled).toBe(true);
  });

  it("muestra errores al responder", () => {
    render(
      <ConnectionRequestDetail
        request={request}
        onBack={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        responseError="No se pudo aceptar la solicitud"
      />,
    );

    expect(
      screen.getByRole("alert").textContent,
    ).toContain("No se pudo aceptar la solicitud");
  });

  it("permite volver a la lista de chats", () => {
    const onBack = vi.fn();

    render(
      <ConnectionRequestDetail
        request={request}
        onBack={onBack}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        isCompact
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Volver a la lista de chats",
      }),
    );

    expect(onBack).toHaveBeenCalledOnce();
  });
});
