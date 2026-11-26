import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MessageItem } from "../components/message-item";
import type { Message } from "../types/conversation.types";
import * as chatApi from "../services/chat-api";

describe("Detección de Enlaces y Vista Previa Web (HU-11 Task 5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    chatApi.clearLinkPreviewCache();
  });

  afterEach(() => {
    cleanup();
  });

  it("criterio 3: si hay multiples URLs, todas son clicables pero se solicita vista previa solo para la primera", async () => {
    const spyGetLinkPreview = vi.spyOn(chatApi, "getLinkPreview").mockResolvedValue({
      url: "https://primero.com",
      domain: "primero.com",
      title: "Sitio Primero Oficial",
      description: "Descripcion del primer sitio",
      imageUrl: "https://primero.com/logo.png",
      hasPreview: true,
    });

    const message: Message = {
      id: "msg-link-multi",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Mira https://primero.com y tambien visita https://segundo.com/info aqui",
      timestamp: "2026-10-28T12:00:00Z",
      createdAt: "2026-10-28T12:00:00Z",
      status: "sent",
    };

    render(<MessageItem message={message} isOwn={false} />);

    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "https://primero.com")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "https://segundo.com/info")).toBe(true);

    await waitFor(() => {
      expect(spyGetLinkPreview).toHaveBeenCalledTimes(1);
      expect(spyGetLinkPreview).toHaveBeenCalledWith("https://primero.com");
    });

    await waitFor(() => {
      expect(screen.getByTestId("chat-link-preview-card")).toBeInTheDocument();
      expect(screen.getByTestId("link-preview-title")).toHaveTextContent("Sitio Primero Oficial");
      expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("primero.com");
    });
  });

  it("criterio 5: si la URL no tiene metadatos o la peticion falla, se muestra el link normal sin romper la UI", async () => {
    vi.spyOn(chatApi, "getLinkPreview").mockResolvedValue(null);

    const message: Message = {
      id: "msg-link-error",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Enlace roto o sin metadatos: https://pagina-desconocida.xyz/404",
      timestamp: "2026-10-28T12:00:00Z",
      createdAt: "2026-10-28T12:00:00Z",
      status: "sent",
    };

    render(<MessageItem message={message} isOwn={false} />);

    const link = screen.getByRole("link", { name: "https://pagina-desconocida.xyz/404" });
    expect(link).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("chat-link-preview-card")).not.toBeInTheDocument();
    });
  });

  it("criterio 6: nombres, titulos y URLs se renderizan como texto plano sanitizado contra XSS", async () => {
    vi.spyOn(chatApi, "getLinkPreview").mockResolvedValue({
      url: "https://sitio-xss.com",
      domain: "<script>alert(1)</script>",
      title: "<img src=x onerror=alert('xss')>",
      description: "Descripcion segura",
      imageUrl: null,
      hasPreview: true,
    });

    const message: Message = {
      id: "msg-xss-metadata",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Revisa https://sitio-xss.com con posibles scripts",
      timestamp: "2026-10-28T12:00:00Z",
      createdAt: "2026-10-28T12:00:00Z",
      status: "sent",
    };

    render(<MessageItem message={message} isOwn={false} />);

    await waitFor(() => {
      expect(document.querySelector("script")).toBeNull();
      expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("<script>alert(1)</script>");
      expect(screen.getByTestId("link-preview-title")).toHaveTextContent("<img src=x onerror=alert('xss')>");
    });
  });

  it("renderiza vista previa de enlaces cuando el mensaje posee un adjunto LINK preexistente", () => {
    const message: Message = {
      id: "msg-link-att",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Revisa el portal institucional",
      timestamp: "2026-10-28T12:00:00Z",
      createdAt: "2026-10-28T12:00:00Z",
      status: "sent",
      attachment: {
        id: "att-link-1",
        fileName: "Universidad Mayor de San Simón",
        mimeType: "text/html",
        fileSize: 0,
        url: "https://umss.edu.bo",
        thumbnailUrl: "https://umss.edu.bo/logo.png",
        type: "LINK",
      },
    };

    render(<MessageItem message={message} isOwn={false} />);

    expect(screen.getByTestId("chat-link-preview-card")).toBeInTheDocument();
    expect(screen.getByTestId("link-preview-title")).toHaveTextContent("Universidad Mayor de San Simón");
    expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("umss.edu.bo");
  });
});
