import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProposalCoverField } from './proposal-cover-field';

afterEach(cleanup);
const cover = { file: new File(['image'], 'portada.png', { type: 'image/png' }), previewUrl: 'https://example.test/portada.png' };

describe('Proposal cover preview', () => {
  it('preserves the upload instructions and the new size limit', () => {
    render(<ProposalCoverField value={null} onChange={vi.fn()} onBusyChange={vi.fn()} />);
    expect(screen.getByText('JPG / PNG')).toBeInTheDocument();
    expect(screen.getByText('Máx. 2 MB')).toBeInTheDocument();
    expect(screen.getByText('1200 × 600 px')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seleccionar imagen' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Ampliar imagen de portada' })).not.toBeInTheDocument();
  });
  it('opens the full image and closes the preview without removing the cover', async () => {
    const onChange = vi.fn();
    render(<ProposalCoverField value={cover} onChange={onChange} onBusyChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar imagen de portada' }));
    expect(await screen.findByRole('dialog', { name: 'Vista previa de la portada' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portada completa del taller' })).toHaveClass('object-contain');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('retains removal and replacement controls', () => {
    const onChange = vi.fn();
    render(<ProposalCoverField value={cover} onChange={onChange} onBusyChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Cambiar imagen' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar imagen de portada' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
