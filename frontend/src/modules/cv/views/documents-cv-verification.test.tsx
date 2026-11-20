import type { DocumentsCvContentProps } from '../types/documents-cv-content-props.types';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import type { DocumentVerification } from '../types/document-verification.types';
import { DocumentsCvView, LegacyDocumentsCvView } from './documents-cv-view';

const history = vi.hoisted(() => ({
  data: undefined as DocumentVerification[] | undefined,
  isError: false,
  refetch: vi.fn(),
}));
vi.mock('../hooks/use-document-verifications', () => ({
  useDocumentVerifications: () => history,
}));
vi.mock('../components/documents-cv-content', () => ({
  DocumentsCvContent: ({ verification }: DocumentsCvContentProps) => (
    <>
      <p>Contenido de CV disponible</p>
      {verification}
    </>
  ),
}));
beforeEach(() => {
  history.data = undefined;
  history.isError = false;
  history.refetch.mockReset();
});
afterEach(cleanup);

describe('CV verification availability', () => {
  it('keeps CV management available while verification history is loading', () => {
    render(<DocumentsCvView />);
    expect(screen.getByText('Contenido de CV disponible')).toBeInTheDocument();
    expect(screen.getByText('Cargando verificaciones…')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('offers a separate verification retry without hiding CV management', () => {
    history.isError = true;
    render(<DocumentsCvView />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El historial de verificaciones no está disponible.',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reintentar verificación' }),
    );
    expect(history.refetch).toHaveBeenCalledOnce();
    expect(screen.getByText('Contenido de CV disponible')).toBeInTheDocument();
  });

  it('preserves cached history during a refresh error and renders the empty-document state', () => {
    history.data = [];
    history.isError = true;
    render(<DocumentsCvView />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      screen.getByText('Todavía no tienes documentos activos.'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ver historial de verificaciones' }),
    );
    expect(screen.getByText('Aún no hay verificaciones.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('preserves callers of the legacy CV view', () => {
    render(<LegacyDocumentsCvView />);
    expect(screen.getByText('Contenido de CV disponible')).toBeInTheDocument();
    expect(screen.queryByText('Cargando verificaciones…')).toBeNull();
  });
});
