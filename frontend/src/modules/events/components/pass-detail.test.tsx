import "@/shared/testing/indexed-db.mock";
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { PassQr } from './pass-qr';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { registrationsService } from '../services/registrations.service';
import { PassDetail } from './pass-detail';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getPass: vi.fn() } }));
const pass = { id: 'pass-1', eventName: 'React', date: '2026-11-20', startTime: '09:00', endTime: '12:00', location: 'Aula 1', status: 'Confirmada' };
beforeEach(async () => {
  vi.mocked(registrationsService.getPass).mockReset();
  await saveAccessToken("owner-token");
});
afterEach(() => { cleanup(); clearAccessToken(); });

describe('Private pass detail', () => {
  it('describes a real persistent QR without the illustrative Sprint 1 legend', async () => {
    vi.mocked(registrationsService.getPass).mockResolvedValue({ ...pass, qrToken: 'a'.repeat(64) });
    renderWithQuery(<PassDetail registration={pass} />);
    await screen.findByRole('img', { name: 'Código QR del pase' });
    expect(screen.queryByText(/ilustrativo/i)).not.toBeInTheDocument();
  });
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

  describe('with a QR token saved on this device', () => {
    const saved = 'c'.repeat(64);
    const qrMarkup = (token: string) => {
      const { container, unmount } = render(<PassQr token={token} />);
      const markup = container.innerHTML;
      unmount();
      return markup;
    };

    afterEach(() => {
      onlineManager.setOnline(true);
      vi.useRealTimers();
    });

    it('shows the saved QR while offline instead of waiting forever', async () => {
      onlineManager.setOnline(false);
      renderWithQuery(<PassDetail registration={pass} offlineQrToken={saved} />);
      const qr = await screen.findByRole('img', { name: 'Código QR del pase' });
      expect(qr.parentElement?.innerHTML).toBe(qrMarkup(saved));
      expect(screen.queryByText('Generando pase...')).not.toBeInTheDocument();
    });

    it('keeps waiting offline when there is no saved QR', () => {
      onlineManager.setOnline(false);
      renderWithQuery(<PassDetail registration={pass} />);
      expect(screen.getByText('Generando pase...')).toBeInTheDocument();
    });

    it('falls back to the saved QR when the server cannot return the pass', async () => {
      vi.mocked(registrationsService.getPass).mockRejectedValue(new Error('offline'));
      renderWithQuery(<PassDetail registration={pass} offlineQrToken={saved} />);
      await vi.waitFor(() => expect(registrationsService.getPass).toHaveBeenCalled());
      expect(await screen.findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
      expect(screen.queryByText(/No se pudo cargar el pase/)).not.toBeInTheDocument();
    });

    it('prefers the server QR once it loads', async () => {
      vi.mocked(registrationsService.getPass).mockResolvedValue({ ...pass, qrToken: 'a'.repeat(64) });
      renderWithQuery(<PassDetail registration={pass} offlineQrToken={saved} />);
      await vi.waitFor(() => expect(screen.getByRole('img', { name: 'Código QR del pase' }).parentElement?.innerHTML).toBe(qrMarkup('a'.repeat(64))));
    });

    it('does not show a saved QR for a finished workshop', () => {
      vi.useFakeTimers({ now: new Date('2026-11-21T12:00:00Z'), toFake: ['Date'] });
      onlineManager.setOnline(false);
      renderWithQuery(<PassDetail registration={pass} offlineQrToken={saved} />);
      expect(screen.getByText(/Pase finalizado/)).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
    });
  });
});
