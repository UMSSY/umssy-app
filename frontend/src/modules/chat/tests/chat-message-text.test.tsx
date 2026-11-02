import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { ChatMessageText } from "../components/chat-message-text";

describe("ChatMessageText Component (HU-11 Task 5)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza texto normal sin enlaces", () => {
    render(<ChatMessageText content="Hola mundo desde el chat" />);

    expect(screen.getByText("Hola mundo desde el chat")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("criterio 1 y 2: renderiza URLs validas como enlaces clicables con target=_blank y rel=noopener noreferrer", () => {
    render(
      <ChatMessageText content="Visita https://umss.edu.bo para mas informacion" />
    );

    const link = screen.getByRole("link", { name: "https://umss.edu.bo" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://umss.edu.bo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("underline");
  });

  it("criterio 3: si hay multiples URLs en el texto, todas se renderizan como enlaces clicables", () => {
    render(
      <ChatMessageText content="Visita https://umss.edu.bo y tambien http://ejemplo.com/doc" />
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://umss.edu.bo");
    expect(links[1]).toHaveAttribute("href", "http://ejemplo.com/doc");
  });

  it("criterio 4: bloquea esquemas no permitidos (ej. javascript:, data:) mostrandolos como texto plano", () => {
    render(
      <ChatMessageText content="Mira esto javascript:alert('xss') y data:text/html,inseguro" />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByText(/javascript:alert\('xss'\)/)
    ).toBeInTheDocument();
    expect(screen.getByText(/data:text\/html,inseguro/)).toBeInTheDocument();
  });

  it("separa signos de puntuacion finales de la URL para que no formen parte del enlace", () => {
    render(
      <ChatMessageText content="Ingresa a https://umss.edu.bo, luego continua." />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://umss.edu.bo");
    expect(screen.getByText(/, luego continua\./)).toBeInTheDocument();
  });

  it("aplica estilos accesibles contrastados cuando el mensaje es del usuario propio (isOwn=true)", () => {
    render(
      <ChatMessageText
        content="Revisa https://umss.edu.bo"
        isOwn={true}
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-surface");
  });

  it("aplica estilos de acento institucional cuando el mensaje es de otro usuario (isOwn=false)", () => {
    render(
      <ChatMessageText
        content="Revisa https://umss.edu.bo"
        isOwn={false}
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-accent");
  });

  it("criterio 6: sanitiza contra XSS renderizando etiquetas como texto plano escapado", () => {
    render(
      <ChatMessageText content="<script>alert('xss')</script> https://umss.edu.bo <img src=x onerror=alert(1)>" />
    );

    expect(document.querySelector("script")).toBeNull();
    expect(
      screen.getByText(/<script>alert\('xss'\)<\/script>/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/<img src=x onerror=alert\(1\)>/)
    ).toBeInTheDocument();
  });
});
