
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { SendConnectionRequestDialog } from "../components/send-connection-request-dialog";
import type { User } from "../types/user.types";

const contact = {
  id: "user-2",
  fullName: "María Peredo",
  avatarUrl: null,
  headline: "Desarrolladora",
  role: "MENTOR",
  isActive: true,
} as User;

afterEach(() => {
  cleanup();
});

describe("SendConnectionRequestDialog - HU09", () => {
  it("muestra el contacto seleccionado", () => {
    render(
      <SendConnectionRequestDialog
        contact={contact}
        isSending={false}
        error={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("María Peredo"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Enviar solicitud" }),
    ).toBeEnabled();
  });

  it("ejecuta la confirmación al presionar enviar", () => {
    const onConfirm = vi.fn();

    render(
      <SendConnectionRequestDialog
        contact={contact}
        isSending={false}
        error={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitud" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("deshabilita los botones mientras se envía", () => {
    render(
      <SendConnectionRequestDialog
        contact={contact}
        isSending={true}
        error={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Enviando..." }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
  });

  it("muestra el error recibido", () => {
    render(
      <SendConnectionRequestDialog
        contact={contact}
        isSending={false}
        error="Ya existe una solicitud pendiente"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ya existe una solicitud pendiente",
    );
  });

  it("permite cancelar la solicitud", () => {
    const onClose = vi.fn();

    render(
      <SendConnectionRequestDialog
        contact={contact}
        isSending={false}
        error={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no muestra el diálogo sin contacto seleccionado", () => {
    render(
      <SendConnectionRequestDialog
        contact={null}
        isSending={false}
        error={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();
  });
});
