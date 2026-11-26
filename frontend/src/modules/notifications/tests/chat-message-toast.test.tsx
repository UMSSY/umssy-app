import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatMessageToast } from "../components/chat-message-toast";
import { getChatToastTitle } from "../utils/get-chat-toast-title";

afterEach(() => {
  cleanup();
});

describe("ChatMessageToast", () => {
  it("muestra el encabezado de UMSSY, el remitente, la vista previa y el subtexto", () => {
    render(
      <ChatMessageToast
        title="epic sinco"
        preview="Prueba notificación fuera del chat 2 (2 mensajes)"
        siteLabel="dev-umssy.zer4c.dev"
        actionLabel="Ver mensaje"
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("UMSSY")).toBeInTheDocument();
    expect(screen.getByText(/dev-umssy\.zer4c\.dev/)).toBeInTheDocument();
    expect(screen.getByText("Ahora")).toBeInTheDocument();
    expect(screen.getByText("epic sinco")).toBeInTheDocument();
    expect(screen.getByText("Prueba notificación fuera del chat 2 (2 mensajes)")).toBeInTheDocument();
    expect(screen.getByText("Nuevo mensaje de chat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver mensaje" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar notificación" })).toBeInTheDocument();
  });

  it("abre el chat y cierra con sus botones", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(
      <ChatMessageToast
        title="Ana"
        preview="Hola"
        siteLabel="umssy.zer4c.dev"
        actionLabel="Ver mensaje"
        onOpen={onOpen}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ver mensaje" }));
    await user.click(screen.getByRole("button", { name: "Cerrar notificación" }));

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("no muestra el botón de acción si el aviso no tiene enlace", () => {
    render(
      <ChatMessageToast title="Ana" preview="Hola" siteLabel="" actionLabel="Ver mensaje" onClose={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Ver mensaje" })).not.toBeInTheDocument();
  });
});

describe("getChatToastTitle", () => {
  it.each([
    ["Mensaje nuevo de: Juan Pérez", "Juan Pérez"],
    ["Mensaje nuevo en: Taller de React", "Taller de React"],
    ["Aviso sin prefijo", "Aviso sin prefijo"],
    ["Mensaje nuevo de: ", "Mensaje nuevo de: "],
  ])("convierte %s en %s", (title, expected) => {
    expect(getChatToastTitle(title)).toBe(expected);
  });
});