import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteDocument, uploadDocument } from '../services/document-upload.service';
import { DocumentUploadSection } from './document-upload-section';

vi.mock('../services/document-upload.service', () => ({
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

const uploaded = { id: '1', name: 'diploma.pdf', size: 9, mimeType: 'application/pdf' };

function selectFile(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['contenido'], 'diploma.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  window.open = vi.fn();
});

afterEach(cleanup);

describe('DocumentUploadSection', () => {
  it('shows the upload zone at the start', () => {
    render(<DocumentUploadSection />);
    expect(screen.getByText(/Selecciona tu archivo/)).toBeTruthy();
  });

  it('shows the card and the preview after a successful upload', async () => {
    vi.mocked(uploadDocument).mockResolvedValue(uploaded);
    const { container } = render(<DocumentUploadSection />);

    selectFile(container);

    expect(await screen.findByText('Listo')).toBeTruthy();
    expect(screen.getByText('diploma.pdf')).toBeTruthy();
    expect(container.querySelector('object')).not.toBeNull();
  });

  it('opens the document in a new tab with the Ver button', async () => {
    vi.mocked(uploadDocument).mockResolvedValue(uploaded);
    const { container } = render(<DocumentUploadSection />);

    selectFile(container);
    fireEvent.click(await screen.findByText('Ver'));

    expect(window.open).toHaveBeenCalledWith('blob:test', '_blank', 'noopener');
  });

  it('removes the document and shows the upload zone again', async () => {
    vi.mocked(uploadDocument).mockResolvedValue(uploaded);
    vi.mocked(deleteDocument).mockResolvedValue(undefined);
    const { container } = render(<DocumentUploadSection />);

    selectFile(container);
    fireEvent.click(await screen.findByText('Quitar'));

    expect(await screen.findByText(/Selecciona tu archivo/)).toBeTruthy();
    expect(deleteDocument).toHaveBeenCalledWith('1');
  });

  it('shows an error message when the upload fails', async () => {
    vi.mocked(uploadDocument).mockRejectedValue(new Error('fallo'));
    const { container } = render(<DocumentUploadSection />);

    selectFile(container);

    expect(
      await screen.findByText('No se pudo subir el documento. Intenta de nuevo.'),
    ).toBeTruthy();
  });

  it('shows an error message when the removal fails', async () => {
    vi.mocked(uploadDocument).mockResolvedValue(uploaded);
    vi.mocked(deleteDocument).mockRejectedValue(new Error('fallo'));
    const { container } = render(<DocumentUploadSection />);

    selectFile(container);
    fireEvent.click(await screen.findByText('Quitar'));

    expect(
      await screen.findByText('No se pudo quitar el documento. Intenta de nuevo.'),
    ).toBeTruthy();
  });
});
