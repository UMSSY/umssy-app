import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ChatPdfCard } from "../components/chat-pdf-card";
import type { MessageAttachment } from "../types/attachment.types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const samplePdfAttachment: MessageAttachment = {
  id: "att-pdf-1",
  messageId: "msg-pdf-1",
  fileName: "Oferta_desarrollo_web_v2.pdf",
  mimeType: "application/pdf",
  fileSize: 245 * 1024,
  url: "/api/chat/attachments/att-pdf-1/download",
  type: "PDF",
};

describe("ChatPdfCard Component (HU-11 Task 4)", () => {
  it("renderiza la tarjeta con icono de PDF, nombre de archivo y peso formateado ('PDF · 245 KB')", () => {
    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        isOwn={false}
      />
    );

    const card = screen.getByTestId("chat-pdf-card");
    expect(card).toBeDefined();

    const iconContainer = screen.getByTestId("pdf-card-icon-container");
    expect(iconContainer).toBeDefined();

    const filename = screen.getByTestId("pdf-card-filename");
    expect(filename.textContent).toBe("Oferta_desarrollo_web_v2.pdf");

    const meta = screen.getByTestId("pdf-card-meta");
    expect(meta.textContent).toBe("PDF · 245 KB");
  });

  it("aplica clase truncate al nombre de archivo largo para no romper la burbuja", () => {
    const longAttachment: MessageAttachment = {
      ...samplePdfAttachment,
      fileName: "informe_detallado_final_de_arquitectura_del_sistema_en_la_nube_2026.pdf",
    };

    render(
      <ChatPdfCard
        attachment={longAttachment}
        isOwn={true}
      />
    );

    const filename = screen.getByTestId("pdf-card-filename");
    expect(filename.className).toContain("truncate");
    expect(filename.getAttribute("title")).toBe(longAttachment.fileName);
  });

  it("proporciona un botón de descarga directa con aria-label accesible", () => {
    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
      />
    );

    const downloadBtn = screen.getByRole("button", {
      name: "Descargar Oferta_desarrollo_web_v2.pdf",
    });
    expect(downloadBtn).toBeDefined();
    expect(downloadBtn.getAttribute("data-testid")).toBe("pdf-download-button");
  });

  it("ejecuta onDownload al pulsar el botón de descarga", () => {
    const onDownload = vi.fn();

    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        onDownload={onDownload}
      />
    );

    const downloadBtn = screen.getByTestId("pdf-download-button");
    fireEvent.click(downloadBtn);

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledWith(samplePdfAttachment);
  });

  it("utiliza enlace temporal para descargar si onDownload no está presente", () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");

    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
      />
    );

    const downloadBtn = screen.getByTestId("pdf-download-button");
    fireEvent.click(downloadBtn);

    expect(appendSpy).toHaveBeenCalled();
  });

  it("no inicia descarga si ya se encuentra descargando", () => {
    const onDownload = vi.fn();

    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        onDownload={onDownload}
        isDownloading={true}
      />
    );

    const downloadBtn = screen.getByTestId("pdf-download-button");
    fireEvent.click(downloadBtn);

    expect(onDownload).not.toHaveBeenCalled();
  });

  it("muestra spinner de carga y deshabilita el botón cuando isDownloading es true", () => {
    render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        isDownloading={true}
      />
    );

    const downloadBtn = screen.getByTestId("pdf-download-button") as HTMLButtonElement;
    expect(downloadBtn.disabled).toBe(true);
    expect(downloadBtn.querySelector(".animate-spin")).not.toBeNull();
  });

  it("aplica estilos semánticos consistentes según si el mensaje es propio (isOwn)", () => {
    const { rerender } = render(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        isOwn={true}
      />
    );

    let card = screen.getByTestId("chat-pdf-card");
    expect(card.className).toContain("text-surface");

    rerender(
      <ChatPdfCard
        attachment={samplePdfAttachment}
        isOwn={false}
      />
    );

    card = screen.getByTestId("chat-pdf-card");
    expect(card.className).toContain("text-ink");
    expect(card.className).toContain("bg-surface-soft");
  });
});
