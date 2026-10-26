import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registrationsService } from '../services/registrations.service';
import { MyPassesView } from './my-passes-view';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getMine: vi.fn(), getPass: vi.fn() } }));
const getMine = vi.mocked(registrationsService.getMine);
const pass = { id: 'reg-1', eventName: 'React', date: '2026-10-20T00:00:00Z', startTime: '1970-01-01T09:00:00Z', endTime: '1970-01-01T12:00:00Z', location: 'Aula 101', status: 'Confirmada' };
beforeEach(() => {
  getMine.mockReset();
  saveAccessToken('session');
  vi.mocked(registrationsService.getPass).mockImplementation(async (id) => {
    const rows = await getMine.mock.results.at(-1)?.value;
    const row = rows?.find((item: typeof pass) => item.id === id);
    if (!row) throw new Error('missing pass');
    return { ...row, qrToken: 'a'.repeat(64) };
  });
});
afterEach(() => { cleanup(); clearAccessToken(); });

describe('Mis pases', () => {
  it('shows the QA location and 24-hour time consistently in passes', async () => {
    getMine.mockResolvedValue([{ ...pass, location: 'Laboratorio 1, Facultad de Ciencias y Tecnología, UMSS' }]);
    render(<MyPassesView />);
    await within(await screen.findByRole('complementary', { name: 'Detalle de la inscripción' })).findByText('reg-1');
    expect(screen.getAllByText('Laboratorio 1, Facultad de Ciencias y Tecnología')).toHaveLength(2);
    expect(screen.queryByText(/, UMSS$/)).not.toBeInTheDocument();
    expect(screen.getByText(/09:00 - 12:00 hrs/)).toBeInTheDocument();
  });

  it('muestra carga, datos reales y cambia el detalle al seleccionar otra inscripción', async () => {
    getMine.mockResolvedValue([pass, { ...pass, id: 'reg-2', eventName: 'Prisma', location: 'Lab 2' }]);
    render(<MyPassesView />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' })).not.toBeInTheDocument();
    await within(await screen.findByRole('complementary', { name: 'Detalle de la inscripción' })).findByText('reg-1');
    expect(screen.getAllByText('Aula 101')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 pases')).toBeInTheDocument();
    expect(screen.getByText(/09:00 - 12:00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Prisma/ }));
    expect(within(screen.getByRole('complementary', { name: 'Detalle de la inscripción' })).getByText('reg-2')).toBeInTheDocument();
    expect(screen.getAllByText('Lab 2')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveClass('bg-accent', 'text-surface');
    expect(screen.getByRole('button', { name: /React/ })).toHaveClass('bg-surface');
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'false');
    expect(within(screen.getByRole('complementary', { name: 'Detalle de la inscripción' })).queryByText('reg-1')).not.toBeInTheDocument();
  });
  it('muestra el estado vacío y acceso al catálogo', async () => {
    getMine.mockResolvedValue([]);
    render(<MyPassesView />);
    expect(await screen.findByRole('region', { name: 'Aún no tienes inscripciones.' })).toBeInTheDocument();
    expect(screen.getByText('0 pases')).toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Vista ilustrativa de QR')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar talleres disponibles' })).toHaveAttribute('href', '/events');
  });
  it('permite reintentar y muestra un único pase después de recuperarse', async () => {
    getMine.mockRejectedValueOnce(new Error('Debes iniciar sesión')).mockResolvedValueOnce([pass]);
    render(<MyPassesView />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await within(await screen.findByRole('complementary', { name: 'Detalle de la inscripción' })).findByText('reg-1');
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledTimes(2);
  });
  it.each([
    [{ isAxiosError: true, response: { status: 401, data: { statusCode: 401, ok: false, code: 'UNAUTHENTICATED', detail: 'Sesión inválida', data: null } } }, 'Inicia sesión para continuar'],
    [{ isAxiosError: true, response: { status: 403, data: { statusCode: 403, ok: false, code: 'USER_INACTIVE', detail: 'Usuario inactivo', data: null } } }, 'Tu cuenta está inactiva'],
    [{ isAxiosError: true, response: { status: 500 } }, 'No pudimos completar la operación'],
    [{ isAxiosError: true }, 'No pudimos completar la operación'],
    ['unknown', 'No pudimos completar la operación'],
  ])('presenta el error apropiado: %s', async (cause, message) => {
    getMine.mockRejectedValue(cause);
    render(<MyPassesView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' })).not.toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
  });
  it.each([true, false])('cancela la consulta al desmontar sin actualizar la vista: %s', async (success) => {
    let resolve!: (items: typeof pass[]) => void;
    let reject!: (cause: unknown) => void;
    getMine.mockReturnValue(new Promise((res, rej) => { resolve = res; reject = rej; }));
    const { unmount } = render(<MyPassesView />);
    const signal = getMine.mock.calls[0][0];
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => { if (success) resolve([pass]); else reject(new Error('cancelled')); });
    await waitFor(() => expect(screen.queryByText('React')).not.toBeInTheDocument());
  });
  it('shows the location in the list and the registration ID in the selected detail', async () => {
    const longPass = { ...pass, id: '123e4567-e89b-12d3-a456-426614174000', eventName: 'Taller'.repeat(80), location: 'Ubicación'.repeat(80) };
    getMine.mockResolvedValue([longPass]);
    render(<MyPassesView />);
    const card = await screen.findByRole('button', { name: new RegExp(longPass.eventName) });
    expect(within(card).getByText(longPass.location)).toBeInTheDocument();
    expect(within(card).getByText(longPass.id)).toBeInTheDocument();
    expect(within(card).getByText('ID Inscripción:')).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Detalle de la inscripción' })).getByText(longPass.id)).toBeInTheDocument();
    expect(within(card).getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
  });

});
