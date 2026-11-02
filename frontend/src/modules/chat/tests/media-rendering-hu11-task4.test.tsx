import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { ChatRoom } from "../components/chat-room";
import type { Conversation, Message } from "../types/conversation.types";
import * as chatApi from "../services/chat-api";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockConversation: Conversation = {
  id: "conv-hu11-test",
  contact: {
    id: "user-contact-1",
    fullName: "María Fernández",
    avatarUrl: null,
    isOnline: true,
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

const multimediaMessages: Message[] = [
  // 1. Mensaje con imagen recibido
  {
    id: "msg-media-img-in",
    conversationId: "conv-hu11-test",
    senderId: "user-contact-1",
    content: "Foto del campus central",
    timestamp: "2026-10-28T10:20:00.000Z",
    status: "sent",
    createdAt: "2026-10-28T10:20:00.000Z",
    isAttachment: true,
    attachmentType: "image",
    attachment: {
      id: "att-img-1",
      fileName: "campus.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024 * 400,
      url: "https://example.com/campus.jpg",
      type: "IMAGE",
    },
  },
  // 2. Mensaje con imagen enviado
  {
    id: "msg-media-img-out",
    conversationId: "conv-hu11-test",
    senderId: "current-user",
    content: "Esta es la oficina¡!",
    timestamp: "2026-10-28T10:22:00.000Z",
    status: "sent",
    createdAt: "2026-10-28T10:22:00.000Z",
    isAttachment: true,
    attachmentType: "image",
    attachment: {
      id: "att-img-2",
      fileName: "oficina.png",
      mimeType: "image/png",
      fileSize: 1024 * 800,
      url: "https://example.com/oficina.png",
      type: "IMAGE",
    },
  },
  // 3. Mensaje con PDF recibido
  {
    id: "msg-media-pdf-in",
    conversationId: "conv-hu11-test",
    senderId: "user-contact-1",
    content: "Te comparto el temario",
    timestamp: "2026-10-28T10:25:00.000Z",
    status: "sent",
    createdAt: "2026-10-28T10:25:00.000Z",
    isAttachment: true,
    attachmentType: "file",
    attachment: {
      id: "att-pdf-1",
      fileName: "Temario_Taller.pdf",
      mimeType: "application/pdf",
      fileSize: 1024 * 512,
      url: "/api/chat/attachments/att-pdf-1/download",
      type: "PDF",
    },
  },
  // 4. Mensaje con PDF enviado con nombre largo
  {
    id: "msg-media-pdf-out",
    conversationId: "conv-hu11-test",
    senderId: "current-user",
    content: "Oferta_desarrollo_software_fullstack_2026_valida_para_postulacion.pdf",
    timestamp: "2026-10-28T10:28:00.000Z",
    status: "sent",
    createdAt: "2026-10-28T10:28:00.000Z",
    isAttachment: true,
    attachmentType: "file",
    attachment: {
      id: "att-pdf-2",
      fileName: "Oferta_desarrollo_software_fullstack_2026_valida_para_postulacion.pdf",
      mimeType: "application/pdf",
      fileSize: 245 * 1024,
      url: "/api/chat/attachments/att-pdf-2/download",
      type: "PDF",
    },
  },
];

describe("Renderizado de Miniaturas y Tarjetas PDF en el Chat (HU-11 Task 4)", () => {
  it("renderiza miniaturas de imagen responsivas dentro de la burbuja con caption y hora", () => {
    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    // Verificamos imagen recibida y enviada
    const receivedImg = screen.getByRole("img", { name: "campus.jpg" });
    expect(receivedImg).toBeDefined();
    expect(screen.getByText("Foto del campus central")).toBeDefined();

    const sentImg = screen.getByRole("img", { name: "oficina.png" });
    expect(sentImg).toBeDefined();
    expect(screen.getByText("Esta es la oficina¡!")).toBeDefined();

    // Verificamos que ambos contienen miniatura dentro de su burbuja
    const thumbnails = screen.getAllByTestId("chat-image-thumbnail");
    expect(thumbnails.length).toBe(2);
  });

  it("renderiza documentos PDF como tarjetas con icono PDF, nombre truncado, peso formateado y botón de descarga", () => {
    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const pdfCards = screen.getAllByTestId("chat-pdf-card");
    expect(pdfCards.length).toBe(2);

    expect(screen.getByText("Temario_Taller.pdf")).toBeDefined();
    expect(screen.getByText("PDF · 512 KB")).toBeDefined();

    // Nombre largo con truncate
    const longName = screen.getByText("Oferta_desarrollo_software_fullstack_2026_valida_para_postulacion.pdf");
    expect(longName.className).toContain("truncate");
    expect(screen.getByText("PDF · 245 KB")).toBeDefined();

    // Botones de descarga
    const downloadButtons = screen.getAllByTestId("pdf-download-button");
    expect(downloadButtons.length).toBe(2);
  });

  it("descarga el archivo original al pulsar el botón de descarga en la tarjeta PDF", async () => {
    const downloadSpy = vi
      .spyOn(chatApi, "downloadAttachment")
      .mockResolvedValueOnce(undefined);

    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const downloadButtons = screen.getAllByTestId("pdf-download-button");
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledTimes(1);
      expect(downloadSpy).toHaveBeenCalledWith("att-pdf-1", "Temario_Taller.pdf");
    });
  });

  it("mantiene el mismo formato visual para remitente y destinatario con alineación simétrica", () => {
    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    const receivedWrapper = screen.getByTestId("message-item-msg-media-pdf-in");
    expect(receivedWrapper.className).toContain("justify-start");

    const sentWrapper = screen.getByTestId("message-item-msg-media-pdf-out");
    expect(sentWrapper.className).toContain("justify-end");
  });

  it("muestra indicador de subida y deshabilita el envío mientras el archivo se está subiendo", async () => {
    let resolveSend: () => void = () => {};
    const onSendMessage = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        })
    );

    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={onSendMessage}
      />
    );

    const file = new File(["dummy image"], "nueva_foto.png", { type: "image/png" });
    const fileInput = screen.getByTestId("file-input");

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Se muestra la preview del adjunto
    expect(screen.getByTestId("attachment-preview")).toBeDefined();
    expect(screen.getByTestId("attachment-name").textContent).toBe("nueva_foto.png");

    const sendButton = screen.getByTestId("send-button");
    fireEvent.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledWith("", file);
    expect(screen.getByText("Subiendo...")).toBeDefined();

    // Terminamos la subida
    resolveSend();
    await waitFor(() => {
      expect(screen.queryByText("Subiendo...")).toBeNull();
    });
  });

  it("conserva el borrador y el adjunto para reintentar si ocurre un fallo al enviar", async () => {
    const onSendMessage = vi.fn().mockRejectedValueOnce(new Error("Network Error"));

    render(
      <ChatRoom
        conversation={mockConversation}
        messages={multimediaMessages}
        currentUserId="current-user"
        onBack={vi.fn()}
        onSendMessage={onSendMessage}
      />
    );

    const file = new File(["pdf content"], "propuesta.pdf", { type: "application/pdf" });
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    const textarea = screen.getByTestId("message-textarea");
    fireEvent.change(textarea, { target: { value: "Comentario adicional" } });

    const sendButton = screen.getByTestId("send-button");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });

    // Se conserva el adjunto y el texto para reintentar
    expect(screen.getByTestId("attachment-preview")).toBeDefined();
    expect(screen.getByTestId("attachment-name").textContent).toBe("propuesta.pdf");
    expect((screen.getByTestId("message-textarea") as HTMLTextAreaElement).value).toBe("Comentario adicional");
  });
});

