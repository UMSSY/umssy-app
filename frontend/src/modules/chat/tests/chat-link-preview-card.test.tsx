import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { ChatLinkPreviewCard } from "../components/chat-link-preview-card";
import type { LinkPreviewData } from "../types/link-preview.types";

describe("ChatLinkPreviewCard Component (HU-11 Task 5)", () => {
  afterEach(() => {
    cleanup();
  });

  const mockPreview: LinkPreviewData = {
    url: "https://umss.edu.bo/carreras",
    domain: "umss.edu.bo",
    title: "Carreras de Pregrado y Postgrado - UMSS",
    description: "Oferta académica completa de la Universidad Mayor de San Simón en Cochabamba.",
    imageUrl: "https://umss.edu.bo/banner.jpg",
    hasPreview: true,
  };

  it("renderiza el dominio, titulo, descripcion y miniatura correctamente", () => {
    render(<ChatLinkPreviewCard preview={mockPreview} />);

    expect(screen.getByTestId("chat-link-preview-card")).toBeInTheDocument();
    expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("umss.edu.bo");
    expect(screen.getByTestId("link-preview-title")).toHaveTextContent(
      "Carreras de Pregrado y Postgrado - UMSS"
    );
    expect(screen.getByTestId("link-preview-description")).toHaveTextContent(
      "Oferta académica completa de la Universidad Mayor de San Simón en Cochabamba."
    );
    expect(screen.getByAltText("Carreras de Pregrado y Postgrado - UMSS")).toBeInTheDocument();
  });

  it("criterio 2: el enlace abre en pestaña nueva sin cerrar ni interrumpir el chat", () => {
    render(<ChatLinkPreviewCard preview={mockPreview} />);

    const card = screen.getByTestId("chat-link-preview-card");
    expect(card).toHaveAttribute("href", "https://umss.edu.bo/carreras");
    expect(card).toHaveAttribute("target", "_blank");
    expect(card).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("criterio 5: si hasPreview es false, no renderiza nada para no romper la UI", () => {
    const { container } = render(
      <ChatLinkPreviewCard
        preview={{
          url: "https://sin-metadatos.com",
          domain: "sin-metadatos.com",
          title: null,
          description: null,
          imageUrl: null,
          hasPreview: false,
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("chat-link-preview-card")).not.toBeInTheDocument();
  });

  it("oculta la miniatura si falla al cargar la imagen sin romper la tarjeta ni mostrar error", () => {
    render(<ChatLinkPreviewCard preview={mockPreview} />);

    const img = screen.getByAltText("Carreras de Pregrado y Postgrado - UMSS");
    fireEvent.error(img);

    expect(screen.queryByTestId("link-preview-image-container")).not.toBeInTheDocument();
    // La tarjeta, el dominio y el titulo deben seguir presentes
    expect(screen.getByTestId("link-preview-title")).toBeInTheDocument();
  });

  it("renderiza correctamente cuando no hay descripcion ni imagen", () => {
    const minimalPreview: LinkPreviewData = {
      url: "https://github.com",
      domain: "github.com",
      title: "GitHub",
      description: null,
      imageUrl: null,
      hasPreview: true,
    };

    render(<ChatLinkPreviewCard preview={minimalPreview} />);

    expect(screen.getByTestId("chat-link-preview-card")).toBeInTheDocument();
    expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("github.com");
    expect(screen.getByTestId("link-preview-title")).toHaveTextContent("GitHub");
    expect(screen.queryByTestId("link-preview-description")).not.toBeInTheDocument();
    expect(screen.queryByTestId("link-preview-image-container")).not.toBeInTheDocument();
  });

  it("soporta estilos diferenciados para mensaje propio (isOwn=true)", () => {
    render(<ChatLinkPreviewCard preview={mockPreview} isOwn={true} />);

    const card = screen.getByTestId("chat-link-preview-card");
    expect(card).toHaveClass("text-surface");
  });

  it("criterio 6: sanitiza contra XSS en titulo, descripcion y dominio", () => {
    const xssPreview: LinkPreviewData = {
      url: "https://safe-domain.com",
      domain: "<script>alert(1)</script>",
      title: "<img src=x onerror=alert('xss')>",
      description: "<b>negrita no permitida como html</b>",
      imageUrl: null,
      hasPreview: true,
    };

    render(<ChatLinkPreviewCard preview={xssPreview} />);

    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByTestId("link-preview-domain")).toHaveTextContent("<script>alert(1)</script>");
    expect(screen.getByTestId("link-preview-title")).toHaveTextContent("<img src=x onerror=alert('xss')>");
    expect(screen.getByTestId("link-preview-description")).toHaveTextContent("<b>negrita no permitida como html</b>");
  });
});
