import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ChatImageThumbnail } from "../components/chat-image-thumbnail";
import type { MessageAttachment } from "../types/attachment.types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const sampleAttachment: MessageAttachment = {
  id: "att-img-1",
  messageId: "msg-1",
  fileName: "captura_pantalla.png",
  mimeType: "image/png",
  fileSize: 1024 * 350,
  url: "https://example.com/captura.png",
  type: "IMAGE",
};

describe("ChatImageThumbnail Component (HU-11 Task 4)", () => {
  it("renderiza la miniatura con alt text accesible correspondiente al nombre de archivo", () => {
    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        isOwn={false}
      />
    );

    const img = screen.getByRole("img", { name: "captura_pantalla.png" });
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/captura.png");
  });

  it("renderiza el texto de descripción (caption) debajo de la imagen en la misma burbuja", () => {
    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        caption="Esta es la oficina principal"
        isOwn={true}
      />
    );

    const caption = screen.getByTestId("image-caption");
    expect(caption).toBeDefined();
    expect(caption.textContent).toBe("Esta es la oficina principal");
    expect(caption.className).toContain("text-surface");
  });

  it("no muestra el párrafo de caption si el texto es vacío o nulo", () => {
    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        caption="   "
        isOwn={false}
      />
    );

    expect(screen.queryByTestId("image-caption")).toBeNull();
  });

  it("muestra fallback visual si la imagen produce un error de carga o carece de url", () => {
    const { rerender } = render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        isOwn={false}
      />
    );

    const img = screen.getByRole("img");
    fireEvent.error(img);

    let fallback = screen.getByTestId("image-fallback");
    expect(fallback).toBeDefined();
    expect(screen.getByText("No se pudo cargar la previsualización")).toBeDefined();
    expect(screen.getByText("captura_pantalla.png")).toBeDefined();

    // Sin URL
    rerender(
      <ChatImageThumbnail
        attachment={{ ...sampleAttachment, url: "" }}
        isOwn={false}
      />
    );
    fallback = screen.getByTestId("image-fallback");
    expect(fallback).toBeDefined();
  });

  it("invoca onImageClick cuando el usuario hace clic en el contenedor de la imagen", () => {
    const onImageClick = vi.fn();

    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        onImageClick={onImageClick}
        isOwn={false}
      />
    );

    const thumbnail = screen.getByLabelText("Ver imagen: captura_pantalla.png");
    fireEvent.click(thumbnail);

    expect(onImageClick).toHaveBeenCalledTimes(1);
    expect(onImageClick).toHaveBeenCalledWith(sampleAttachment);
  });

  it("abre ventana con window.open cuando onImageClick no se proporciona y se clica la imagen", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        isOwn={false}
      />
    );

    const thumbnail = screen.getByLabelText("Ver imagen: captura_pantalla.png");
    fireEvent.click(thumbnail);

    expect(openSpy).toHaveBeenCalledWith("https://example.com/captura.png", "_blank", "noopener,noreferrer");
  });

  it("permite interacción por teclado (Enter o Espacio) para accesibilidad", () => {
    const onImageClick = vi.fn();

    render(
      <ChatImageThumbnail
        attachment={sampleAttachment}
        onImageClick={onImageClick}
      />
    );

    const thumbnail = screen.getByLabelText("Ver imagen: captura_pantalla.png");
    fireEvent.keyDown(thumbnail, { key: "Enter" });
    expect(onImageClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(thumbnail, { key: " " });
    expect(onImageClick).toHaveBeenCalledTimes(2);

    // Otra tecla no hace trigger
    fireEvent.keyDown(thumbnail, { key: "Escape" });
    expect(onImageClick).toHaveBeenCalledTimes(2);
  });
});
