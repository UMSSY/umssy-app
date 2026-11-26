import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { MessageInputBar } from "../components/message-input-bar";

afterEach(() => {
  cleanup();
});

describe("MessageInputBar - foco después de enviar", () => {
  it("devuelve el foco al campo de texto al enviar con el botón", () => {
    const onSend = vi.fn();
    render(<MessageInputBar value="Hola" onChange={vi.fn()} onSend={onSend} />);

    const sendButton = screen.getByTestId("send-button");
    sendButton.focus();
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("message-textarea")).toHaveFocus();
  });

  it("mantiene el foco en el campo mientras el mensaje se envía", () => {
    const { rerender } = render(
      <MessageInputBar value="Hola" onChange={vi.fn()} onSend={vi.fn()} />,
    );
    const textarea = screen.getByTestId("message-textarea") as HTMLTextAreaElement;
    textarea.focus();

    rerender(
      <MessageInputBar value="Hola" onChange={vi.fn()} onSend={vi.fn()} isSending />,
    );
    expect(textarea.readOnly).toBe(true);
    expect(textarea.disabled).toBe(false);
    expect(textarea).toHaveFocus();

    rerender(<MessageInputBar value="" onChange={vi.fn()} onSend={vi.fn()} />);
    expect(textarea.readOnly).toBe(false);
    expect(textarea).toHaveFocus();
  });

  it("sigue deshabilitando el campo cuando la conversación no está disponible", () => {
    render(<MessageInputBar value="" onChange={vi.fn()} onSend={vi.fn()} disabled />);

    expect(screen.getByTestId("message-textarea")).toBeDisabled();
  });
});