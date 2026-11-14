import "@/shared/testing/indexed-db.mock";
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { registrationsService } from '../services/registrations.service';
import { offlinePassesStore } from '../utils/offline-passes-store';
import { MyPassesView } from './my-passes-view';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getMine: vi.fn(), getPass: vi.fn() } }));
const getMine = vi.mocked(registrationsService.getMine);
const pass = { id: 'reg-1', eventName: 'React', date: '2026-10-20T00:00:00Z', startTime: '1970-01-01T09:00:00Z', endTime: '1970-01-01T12:00:00Z', location: 'Aula 101', status: 'Confirmada' };
beforeEach(async () => {
  vi.useFakeTimers({ now: new Date("2026-10-19T12:00:00Z"), toFake: ["Date"] });
  getMine.mockReset();
  await saveAccessToken("session");
  vi.mocked(registrationsService.getPass).mockImplementation(async (id) => {
    const rows = await getMine.mock.results.at(-1)?.value;
    const row = rows?.find((item: typeof pass) => item.id === id);
    if (!row) throw new Error('missing pass');
    return { ...row, qrToken: 'a'.repeat(64) };
  });
});
afterEach(() => { cleanup(); clearAccessToken(); vi.useRealTimers(); });

describe("Mis pases", () => {
  it('preserves different workshops with identical names and dates', async () => {
    getMine.mockResolvedValue([{ ...pass, eventId: 'event-1' }, { ...pass, id: 'reg-2', eventId: 'event-2' }]);
    render(<MyPassesView />);
    expect(await screen.findByText('2 pases')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /React/ })).toHaveLength(2);
  });

  it('keeps the card and ticket active before the event closes', async () => {
    vi.setSystemTime(new Date('2026-10-20T15:59:59Z'));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);
    const panel = await screen.findByRole('complementary');
    await within(panel).findByText('Confirmada');
    expect(within(screen.getByRole('button', { name: /React/ })).getByText('Confirmada')).toBeInTheDocument();
    expect(await within(panel).findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
  });

  it('retira automáticamente los pases al llegar su hora de cierre sin volver a consultar', async () => {
    vi.useFakeTimers({
      now: new Date('2026-10-20T15:59:59.000Z'),
      toFake: ['Date', 'setInterval', 'clearInterval'],
    });
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-2', eventName: 'Prisma', date: '2026-10-21T00:00:00Z' },
    ]);

    render(<MyPassesView />);

    expect(await screen.findByText('2 pases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /React/ })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(await screen.findByText('1 pase')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /React/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prisma/ })).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Detalle de la inscripción' });
    expect(await within(panel).findByText('reg-2')).toBeInTheDocument();
    expect(within(panel).queryByText('reg-1')).not.toBeInTheDocument();
    expect(getMine).toHaveBeenCalledTimes(1);
  });

  it('keeps chat unavailable until the chat module is connected', async () => {
    getMine.mockResolvedValue([pass, { ...pass, id: 'reg-2', eventName: 'Prisma' }]);
    render(<MyPassesView />);
    const buttons = await screen.findAllByRole('button', { name: 'Abrir chat del taller' });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'Chat del taller próximamente');
    }
  });

  it('opens chat with the registration reference without selecting a different pass', async () => {
    const onOpenWorkshopChat = vi.fn();
    getMine.mockResolvedValue([pass, { ...pass, id: 'reg-2', eventName: 'Prisma' }]);
    render(<MyPassesView onOpenWorkshopChat={onOpenWorkshopChat} />);
    const buttons = await screen.findAllByRole('button', { name: 'Abrir chat del taller' });
    expect(buttons[1]).toBeEnabled();
    expect(buttons[1].parentElement?.closest('button')).toBeNull();
    fireEvent.click(buttons[1]);
    expect(onOpenWorkshopChat).toHaveBeenCalledExactlyOnceWith('reg-2');
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the QA location and 24-hour time consistently in passes', async () => {
    getMine.mockResolvedValue([{ ...pass, location: 'Laboratorio 1, Facultad de Ciencias y Tecnología, UMSS' }]);
    render(<MyPassesView />);
    await within(await screen.findByRole('complementary', { name: 'Detalle de la inscripción' })).findByText('reg-1');
    expect(screen.getAllByText('Laboratorio 1, Facultad de Ciencias y Tecnología')).toHaveLength(2);
    expect(screen.queryByText(/, UMSS$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/09:00 - 12:00 hrs/).length).toBeGreaterThan(0);
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
    expect(screen.getAllByText(/09:00 - 12:00/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Prisma/ }));
    expect(within(screen.getByRole('complementary', { name: 'Detalle de la inscripción' })).getByText('reg-2')).toBeInTheDocument();
    expect(screen.getAllByText('Lab 2')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveClass('bg-accent', 'text-accent-foreground');
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

  it.each([true, false])(
    "cancela la consulta al desmontar sin actualizar la vista: %s",
    async (success) => {
      let resolve!: (items: (typeof pass)[]) => void;
      let reject!: (cause: unknown) => void;
      getMine.mockReturnValue(new Promise((res, rej) => { resolve = res; reject = rej; }));
      const { unmount } = render(<MyPassesView />);
      const signal = getMine.mock.calls[0][0];
      unmount();
      expect(signal?.aborted).toBe(true);
      await act(async () => { if (success) resolve([pass]); else reject(new Error('cancelled')); });
      await waitFor(() => expect(screen.queryByText('React')).not.toBeInTheDocument());
    },
  );

  it('shows the location in the list and the registration ID in the selected detail', async () => {
    const longPass = { ...pass, date: '2099-10-20T00:00:00Z', id: '123e4567-e89b-12d3-a456-426614174000', eventName: 'Taller'.repeat(80), location: 'Ubicación'.repeat(80) };
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

describe('Mis pases sin conexión', () => {
  const userToken = `h.${btoa(JSON.stringify({ sub: 'user-a' }))}.s`;
  const saved = { ...pass, qrToken: 'c'.repeat(64) };
  const goOffline = () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    onlineManager.setOnline(false);
  };

  beforeEach(async () => {
    await saveAccessToken(userToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    onlineManager.setOnline(true);
  });

  it('shows the saved passes and QR offline with the last update and blocked actions', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    goOffline();
    render(<MyPassesView onOpenWorkshopChat={vi.fn()} />);
    expect(await screen.findByText('Sin conexión. Estás viendo tus pases guardados.')).toBeInTheDocument();
    expect(screen.getByText(/^Última actualización: .*2026/)).toBeInTheDocument();
    const panel = await screen.findByRole('complementary', { name: 'Detalle de la inscripción' });
    expect(await within(panel).findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    const chat = screen.getByRole('button', { name: 'Abrir chat del taller' });
    expect(chat).toBeDisabled();
    expect(chat).toHaveAttribute('title', 'Requiere conexión a Internet');
    const explore = screen.getByRole('button', { name: 'Explorar talleres' });
    expect(explore).toBeDisabled();
    expect(explore).toHaveAttribute('title', 'Requiere conexión a Internet');
    expect(screen.queryByRole('link', { name: 'Explorar talleres' })).not.toBeInTheDocument();
    expect(getMine).not.toHaveBeenCalled();
  });

  it('explains there is no saved copy instead of showing the empty registrations state', async () => {
    goOffline();
    render(<MyPassesView />);
    const noCopy = await screen.findByRole('heading', { name: 'No hay pases guardados en este dispositivo.' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No pudimos completar la operación. Inténtalo más tarde.');
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(noCopy.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' })).not.toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
  });

  it('marks only the passes saved on this device while online', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    getMine.mockResolvedValue([pass, { ...pass, id: 'reg-2', eventName: 'Prisma' }]);
    render(<MyPassesView />);
    expect(await screen.findByText('Disponible sin conexión')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /React/ })).getByText('Disponible sin conexión')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Prisma/ })).queryByText('Disponible sin conexión')).not.toBeInTheDocument();
    expect(screen.queryByText(/pases guardados sin conexión/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar talleres' })).toHaveAttribute('href', '/events');
  });

  it('falls back to the saved copy when the online refresh fails', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    getMine.mockRejectedValueOnce(new Error('Sin servidor')).mockResolvedValueOnce([pass]);
    vi.mocked(registrationsService.getPass).mockRejectedValue(new Error('Sin servidor'));
    render(<MyPassesView />);
    expect(await screen.findByText(/No se pudieron actualizar tus pases/)).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Detalle de la inscripción' });
    expect(await within(panel).findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.queryByText(/No se pudieron actualizar tus pases/)).not.toBeInTheDocument());
    expect(getMine).toHaveBeenCalledTimes(2);
  });

  it('shows the no-copy message above the error when the server cannot be reached', async () => {
    getMine.mockRejectedValueOnce({ isAxiosError: true }).mockResolvedValueOnce([pass]);
    render(<MyPassesView />);
    const noCopy = await screen.findByRole('heading', { name: 'No hay pases guardados en este dispositivo.' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No pudimos completar la operación');
    expect(noCopy.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await within(await screen.findByRole('complementary', { name: 'Detalle de la inscripción' })).findByText('reg-1');
    expect(screen.queryByRole('heading', { name: 'No hay pases guardados en este dispositivo.' })).not.toBeInTheDocument();
  });

  it('shows only the server error when the server answered', async () => {
    getMine.mockRejectedValue({ isAxiosError: true, response: { status: 500 } });
    render(<MyPassesView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos completar la operación');
    expect(screen.queryByRole('heading', { name: 'No hay pases guardados en este dispositivo.' })).not.toBeInTheDocument();
  });
});
