import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { toast } from "sonner";
import { MessageInputBar } from '../components/message-input-bar';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
} from '../constants/attachment.constants';

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MessageInputBar - File Attachment & Validation Toasts (HU-11 Task 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:3000/mock-uuid');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const createFile = (name: string, size: number, type: string) => {
    const file = new File(['content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('cuenta con el botón clip y un input file con los tipos aceptados (JPG, PNG, PDF)', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const attachButton = screen.getByTestId('attach-file-button');
    expect(attachButton).toBeInTheDocument();
    expect(attachButton).toHaveAttribute('aria-label', 'Adjuntar archivo');

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,application/pdf'
    );
  });

  it('adjunta imagen válida de hasta 5 MB y habilita el botón Enviar aunque no haya texto', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const sendButton = screen.getByTestId('send-button') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);

    const fileInput = screen.getByTestId('file-input');
    const validImage = createFile('foto.jpg', 2 * 1024 * 1024, 'image/jpeg');

    fireEvent.change(fileInput, { target: { files: [validImage] } });

    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByTestId('attachment-preview')).toBeInTheDocument();
    expect(screen.getByTestId('attachment-name')).toHaveTextContent('foto.jpg');
    expect(screen.getByTestId('attachment-size')).toHaveTextContent('2 MB');
    expect(sendButton.disabled).toBe(false);
  });

  it('muestra Toast de error exacto y no adjunta cuando la imagen supera los 5 MB', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const largeImage = createFile('pesada.png', MAX_IMAGE_SIZE_BYTES + 1024, 'image/png');

    fireEvent.change(fileInput, { target: { files: [largeImage] } });

    expect(toast.error).toHaveBeenCalledWith(
      'La imagen supera el tamaño maximo permitido de 5 MB.'
    );
    expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
    const sendButton = screen.getByTestId('send-button') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it('adjunta PDF válido de hasta 10 MB y muestra tarjeta con ícono y tamaño', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const validPdf = createFile('documento.pdf', 245 * 1024, 'application/pdf');

    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByTestId('attachment-preview')).toBeInTheDocument();
    expect(screen.getByTestId('attachment-name')).toHaveTextContent('documento.pdf');
    expect(screen.getByTestId('attachment-size')).toHaveTextContent('PDF · 245 KB');
  });

  it('muestra Toast de error exacto y no adjunta cuando el PDF supera los 10 MB', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const largePdf = createFile('documento-grande.pdf', MAX_PDF_SIZE_BYTES + 1, 'application/pdf');

    fireEvent.change(fileInput, { target: { files: [largePdf] } });

    expect(toast.error).toHaveBeenCalledWith(
      'El documento supera el tamaño maximo permitido 10 MB.'
    );
    expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
  });

  it('muestra Toast de error de formato no permitido ante archivos ejecutables o no soportados', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const exeFile = createFile('script.exe', 1024, 'application/x-msdownload');

    fireEvent.change(fileInput, { target: { files: [exeFile] } });

    expect(toast.error).toHaveBeenCalledWith(
      'Formato no permitido, Solo puedes adjuntar imágenes (JPG, PNG) o documentos PDF.'
    );
    expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
  });

  it('permite quitar el archivo adjunto pulsando el botón [X]', () => {
    render(
      <MessageInputBar
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const validImage = createFile('foto.jpg', 1024 * 1024, 'image/jpeg');

    fireEvent.change(fileInput, { target: { files: [validImage] } });
    expect(screen.getByTestId('attachment-preview')).toBeInTheDocument();

    const removeButton = screen.getByTestId('remove-attachment-button');
    fireEvent.click(removeButton);

    expect(screen.queryByTestId('attachment-preview')).not.toBeInTheDocument();
    const sendButton = screen.getByTestId('send-button') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it('deshabilita el botón Enviar y muestra spinner cuando isUploading es true', () => {
    render(
      <MessageInputBar
        value="Hola"
        onChange={vi.fn()}
        onSend={vi.fn()}
        isUploading={true}
      />
    );

    const sendButton = screen.getByTestId('send-button') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
    expect(sendButton).toHaveTextContent('Subiendo...');

    const attachButton = screen.getByTestId('attach-file-button') as HTMLButtonElement;
    expect(attachButton.disabled).toBe(true);

    const textarea = screen.getByTestId('message-textarea') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  it('dispara onSend correctamente con texto y archivo adjunto', () => {
    const onSend = vi.fn();
    render(
      <MessageInputBar
        value="Revisa este archivo"
        onChange={vi.fn()}
        onSend={onSend}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const validPdf = createFile('informe.pdf', 500 * 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [validPdf] } });

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
