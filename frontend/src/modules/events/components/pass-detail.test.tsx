import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { registrationsService } from '../services/registrations.service';
import { PassDetail } from './pass-detail';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getPass: vi.fn() } }));
const pass = { id: 'pass-1', eventName: 'React', date: '2026-11-20', startTime: '09:00', endTime: '12:00', location: 'Aula 1', status: 'Confirmada' };
beforeEach(() => { vi.mocked(registrationsService.getPass).mockReset(); saveAccessToken('owner-token'); });
afterEach(() => { cleanup(); clearAccessToken(); });

describe('Private pass detail', () => {
  it('shows an error and retries without rendering a fallback QR', async () => {
    vi.mocked(registrationsService.getPass).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ...pass, qrToken: 'a'.repeat(64) });
    renderWithQuery(<PassDetail registration={pass} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el pase');
    expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
  });

  it('never reuses the previous pass QR while another pass loads or fails', async () => {
    vi.mocked(registrationsService.getPass).mockResolvedValueOnce({ ...pass, qrToken: 'a'.repeat(64) });
    let reject!: (error: Error) => void;
    vi.mocked(registrationsService.getPass).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const { rerender } = renderWithQuery(<PassDetail registration={pass} />);
    await screen.findByRole('img', { name: 'Código QR del pase' });
    rerender(<PassDetail registration={{ ...pass, id: 'pass-2' }} />);
    expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
    await act(async () => { reject(new Error('not found')); });
    await screen.findByRole('alert');
    expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
  });

  it('replaces the QR with the selected pass token after a successful load', async () => {
    vi.mocked(registrationsService.getPass)
      .mockResolvedValueOnce({ ...pass, qrToken: 'a'.repeat(64) })
      .mockResolvedValueOnce({ ...pass, id: 'pass-2', qrToken: 'b'.repeat(64) });
    const { rerender } = renderWithQuery(<PassDetail registration={pass} />);

    const firstQr = await screen.findByRole('img', { name: 'Código QR del pase' });
    rerender(<PassDetail registration={{ ...pass, id: 'pass-2' }} />);
    const secondQr = await screen.findByRole('img', { name: 'Código QR del pase' });

    expect(secondQr.outerHTML).not.toBe(firstQr.outerHTML);
  });

  it('does not request a private pass without authentication', () => {
    clearAccessToken();
    renderWithQuery(<PassDetail registration={pass} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Inicia sesión');
    expect(registrationsService.getPass).not.toHaveBeenCalled();
  });
});
