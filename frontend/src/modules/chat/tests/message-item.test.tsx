import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MessageItem } from "../components/message-item";
import type { Message } from "../types/conversation.types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MessageItem Component (HU-11 Task 4)", () => {
  const baseMessage: Message = {
    id: "msg-test-1",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Mensaje simple de texto",
    timestamp: "2026-10-28T14:30:00.000Z",
    status: "sent",
    createdAt: "2026-10-28T14:30:00.000Z",
  };

  it("renderiza un mensaje simple de texto con su hora y alineación a la izquierda si es recibido", () => {
    render(
      <MessageItem
        message={baseMessage}
        isOwn={false}
      />
    );

    const messageWrapper = screen.getByTestId("message-item-msg-test-1");
    expect(messageWrapper.className).toContain("justify-start");
    expect(screen.getByText("Mensaje simple de texto")).toBeDefined();
  });

  it("renderiza un mensaje propio alineado a la derecha con indicador de estado si aplica", () => {
    const ownMessage: Message = {
      ...baseMessage,
      id: "msg-own-1",
      senderId: "current-user",
      status: "sending",
    };

    render(
      <MessageItem
        message={ownMessage}
        isOwn={true}
      />
    );

    const messageWrapper = screen.getByTestId("message-item-msg-own-1");
    expect(messageWrapper.className).toContain("justify-end");
    expect(screen.getByText("Enviando...")).toBeDefined();
  });

  it("renderiza miniatura de imagen y texto de descripción en la misma burbuja si contiene adjunto de imagen", () => {
    const imageMessage: Message = {
      ...baseMessage,
      id: "msg-img-1",
      content: "Esta es la oficina principal",
      isAttachment: true,
      attachmentType: "image",
      attachment: {
        id: "att-img-1",
        fileName: "oficina.png",
        mimeType: "image/png",
        fileSize: 500000,
        url: "https://example.com/oficina.png",
        type: "IMAGE",
      },
    };

    render(
      <MessageItem
        message={imageMessage}
        isOwn={true}
      />
    );

    expect(screen.getByTestId("chat-image-thumbnail")).toBeDefined();
    expect(screen.getByText("Esta es la oficina principal")).toBeDefined();
  });

  it("renderiza tarjeta de documento PDF con icono, nombre y peso formateado si contiene adjunto PDF", () => {
    const pdfMessage: Message = {
      ...baseMessage,
      id: "msg-pdf-1",
      content: "Documento adjunto",
      isAttachment: true,
      attachmentType: "file",
      attachment: {
        id: "att-pdf-1",
        fileName: "propuesta_proyecto.pdf",
        mimeType: "application/pdf",
        fileSize: 245 * 1024,
        url: "/api/chat/attachments/att-pdf-1/download",
        type: "PDF",
      },
    };

    render(
      <MessageItem
        message={pdfMessage}
        isOwn={false}
      />
    );

    expect(screen.getByTestId("chat-pdf-card")).toBeDefined();
    expect(screen.getByText("propuesta_proyecto.pdf")).toBeDefined();
    expect(screen.getByText("PDF · 245 KB")).toBeDefined();
  });

  it("conecta el botón de descarga del PDF con onDownloadAttachment", () => {
    const onDownload = vi.fn();
    const pdfMessage: Message = {
      ...baseMessage,
      id: "msg-pdf-2",
      content: "oferta.pdf",
      isAttachment: true,
      attachmentType: "file",
      attachment: {
        id: "att-pdf-2",
        fileName: "oferta.pdf",
        mimeType: "application/pdf",
        fileSize: 1024 * 100,
        url: "/api/chat/attachments/att-pdf-2/download",
        type: "PDF",
      },
    };

    render(
      <MessageItem
        message={pdfMessage}
        isOwn={false}
        onDownloadAttachment={onDownload}
      />
    );

    const downloadBtn = screen.getByTestId("pdf-download-button");
    fireEvent.click(downloadBtn);

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledWith(pdfMessage.attachment);
  });

  it("renderiza el separador de fecha si showDateSeparator es true", () => {
    render(
      <MessageItem
        message={baseMessage}
        isOwn={false}
        showDateSeparator={true}
      />
    );

    expect(screen.getByTestId("date-separator-msg-test-1")).toBeDefined();
  });

  it("soporta adjuntos sintéticos o históricos con prefijo [Archivo] sin romper el renderizado", () => {
    const legacyMessage: Message = {
      ...baseMessage,
      id: "msg-legacy-1",
      content: "[Archivo] contrato_firmado.pdf",
      isAttachment: true,
      attachmentType: "file",
    };

    render(
      <MessageItem
        message={legacyMessage}
        isOwn={false}
      />
    );

    expect(screen.getByTestId("chat-pdf-card")).toBeDefined();
    expect(screen.getByText("contrato_firmado.pdf")).toBeDefined();
  });
});

