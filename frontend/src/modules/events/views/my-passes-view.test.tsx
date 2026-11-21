import '@/shared/testing/indexed-db.mock';
import {
  saveAccessToken,
  clearAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { registrationsService } from '../services/registrations.service';
import { registrationsService as sharedRegistrationsService } from '@/modules/event-registrations/services/registrations.service';
import { saveOfflinePass } from '../services/offline-passes.service';
import { offlinePassesStore } from '../utils/offline-passes-store';
import { MyPassesView } from './my-passes-view';

vi.mock('../services/registrations.service', () => ({ registrationsService: { getMine: vi.fn(), getPass: vi.fn(), getFinished: vi.fn(), cancel: vi.fn(),},}));
// Cancellation goes through the shared registrations service used by useCancelRegistration.
vi.mock('@/modules/event-registrations/services/registrations.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/event-registrations/services/registrations.service')>();
  return { registrationsService: { ...actual.registrationsService, cancel: vi.fn() } };
});
const getMine = vi.mocked(registrationsService.getMine);
const getFinished = vi.mocked(registrationsService.getFinished);
const cancelRegistration = vi.mocked(sharedRegistrationsService.cancel);
const pass = { id: 'reg-1', eventName: 'React', date: '2026-10-20T00:00:00Z', startTime: '1970-01-01T09:00:00Z', endTime: '1970-01-01T12:00:00Z', location: 'Aula 101', status: 'Confirmada' };
beforeEach(async () => {
  vi.useFakeTimers({ now: new Date('2026-10-19T12:00:00Z'), toFake: ['Date'] });
  getMine.mockReset();
  getFinished.mockReset();
  cancelRegistration.mockReset();
  await saveAccessToken("session");
  vi.mocked(registrationsService.getPass).mockImplementation(async (id) => {
    const rows = await getMine.mock.results.at(-1)?.value;
    const row = rows?.find((item: typeof pass) => item.id === id);
    if (!row) throw new Error('missing pass');
    return { ...row, qrToken: 'a'.repeat(64) };
  });
});
afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.useRealTimers();
});

describe("Mis pases", () => {
  it('loads finished history lazily and keeps its cards separate from the current panel', async () => {
    getMine.mockResolvedValue([pass]);
    getFinished.mockResolvedValue({ items: [{ id: 'reg-history', title: 'Historia', date: '2026-08-10T00:00:00Z', startTime: pass.startTime, endTime: pass.endTime, location: pass.location }], total: 12, limit: 10, totalPages: 2 });
    render(<MyPassesView />);
    expect(getFinished).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByText('Historia')).toBeInTheDocument();
    expect(screen.getByText('12 pases')).toBeInTheDocument();
    expect(screen.getByText('ID Inscripción:')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Historia/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar más' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    expect(await screen.findByText('1 pase')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    await waitFor(() => expect(getFinished).toHaveBeenCalledTimes(2));
  });
  it('revalidates current passes when returning from history', async () => {
    getMine.mockResolvedValue([pass]);
    getFinished.mockResolvedValue({ items: [], total: 0, limit: 10, totalPages: 0 });
    render(<MyPassesView />);
    await screen.findByText('1 pase');
    expect(getMine).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    await screen.findByText('Aún no tienes talleres finalizados');
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    await waitFor(() => expect(getMine).toHaveBeenCalledTimes(2));
  });
  it('appends the next history page while keeping the backend total', async () => {
    getMine.mockResolvedValue([]);
    getFinished.mockImplementation(async (page) => ({
      items: [{ id: `history-${page}`, title: `History ${page}`, date: pass.date, startTime: pass.startTime, endTime: pass.endTime, location: pass.location }],
      total: 12,
      limit: 10,
      totalPages: 2,
    }));
    render(<MyPassesView />);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByText('History 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
    expect(await screen.findByText('History 2')).toBeInTheDocument();
    expect(screen.getByText('History 1')).toBeInTheDocument();
    expect(screen.getByText('12 pases')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });
  it('shows an empty history without replacing current passes', async () => {
    getMine.mockResolvedValue([pass]);
    getFinished.mockResolvedValue({ items: [], total: 0, limit: 10, totalPages: 0 });
    render(<MyPassesView />);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByText('Aún no tienes talleres finalizados')).toBeInTheDocument();
    expect(screen.getByText('0 pases')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    expect(await screen.findByText('1 pase')).toBeInTheDocument();
  });
  it('allows retrying a history error without affecting current passes', async () => {
    getMine.mockResolvedValue([pass]);
    getFinished.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce({ items: [], total: 0, limit: 10, totalPages: 0 });
    render(<MyPassesView />);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar tu historial');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Aún no tienes talleres finalizados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    expect(await screen.findByText('1 pase')).toBeInTheDocument();
  });
  it('aborts an unfinished history request when returning to current passes', async () => {
    getMine.mockResolvedValue([pass]);
    getFinished.mockImplementation(() => new Promise(() => undefined));
    render(<MyPassesView />);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    await waitFor(() => expect(getFinished).toHaveBeenCalledTimes(1));
    const signal = getFinished.mock.calls[0][2];
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    await waitFor(() => expect(signal?.aborted).toBe(true));
  });
  it('shows history without requesting a QR or saving an offline pass', async () => {
    getMine.mockResolvedValue([]);
    getFinished.mockResolvedValue({ items: [{ id: 'history-only', title: 'History only', date: pass.date, startTime: pass.startTime, endTime: pass.endTime, location: pass.location }], total: 1, limit: 10, totalPages: 1 });
    const saveSpy = vi.spyOn(offlinePassesStore, 'save');
    render(<MyPassesView />);
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByText('History only')).toBeInTheDocument();
    expect(registrationsService.getPass).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: 'Código QR del pase' })).not.toBeInTheDocument();
    saveSpy.mockRestore();
  });
  it('preserves different workshops with identical names and dates', async () => {
    getMine.mockResolvedValue([
      { ...pass, eventId: 'event-1' },
      { ...pass, id: 'reg-2', eventId: 'event-2' },
    ]);
    render(<MyPassesView />);
    expect(await screen.findByText('2 pases')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /React/ })).toHaveLength(2);
  });

  it.each([
    ['2026-10-20T04:00:00Z', true, 'Confirmada'],
    ['2026-10-20T15:59:00Z', true, 'En curso'],
    ['2026-10-20T15:59:59Z', true, 'En curso'],
    ['2026-10-20T16:00:00Z', false, null],
    ['2026-10-21T00:00:00Z', false, null],
  ])('shows the pass only before its Bolivia closing time at %s', async (now, isVisible, expectedStatus) => {
    vi.setSystemTime(new Date(now));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);
    if (isVisible) {
      const visibleStatus = expectedStatus ?? 'Confirmada';
      const panel = await screen.findByRole('complementary');
      await within(panel).findByText(visibleStatus);
      expect(
        within(screen.getByRole('button', { name: /React/ })).getByText(visibleStatus),
      ).toBeInTheDocument();
      expect(
        await within(panel).findByRole('img', { name: 'Código QR del pase' }),
      ).toBeInTheDocument();
      expect(screen.getByText('1 pase')).toBeInTheDocument();
    } else {
      expect(
        await screen.findByRole('region', { name: 'Aún no tienes inscripciones.' }),
      ).toBeInTheDocument();
      expect(screen.getByText('0 pases')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /React/ })).not.toBeInTheDocument();
    }
  });

  it('marks a confirmed pass as in progress after its Bolivia start time', async () => {
    vi.setSystemTime(new Date('2026-10-20T15:00:00Z'));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);
    expect(await screen.findAllByText('En curso')).toHaveLength(2);
    const status = within(screen.getByRole('button', { name: /React/ })).getByText(
      'En curso',
      { selector: 'div.rounded-md' },
    );
    expect(status).toHaveClass('bg-success', 'text-surface');
  });

  it('removes a closing selected pass and selects the next one without reordering', async () => {
    vi.setSystemTime(new Date('2026-10-20T15:59:59.900Z'));
    getMine.mockResolvedValue([
      { ...pass, id: 'reg-first', eventName: 'Primero', endTime: '1970-01-01T17:00:00Z' },
      { ...pass, id: 'reg-closing', eventName: 'Cierra ahora' },
      { ...pass, id: 'reg-next', eventName: 'Siguiente', endTime: '1970-01-01T18:00:00Z' },
    ]);
    render(<MyPassesView />);
    await screen.findByText('3 pases');
    fireEvent.click(screen.getByRole('button', { name: /Cierra ahora/ }));
    expect(screen.getByRole('button', { name: /Cierra ahora/ })).toHaveAttribute('aria-pressed', 'true');

    vi.setSystemTime(new Date('2026-10-20T16:00:00Z'));
    await waitFor(() => expect(screen.getByText('2 pases')).toBeInTheDocument());

    const remaining = within(screen.getByRole('region', { name: 'Tus inscripciones' })).getAllByRole('listitem');
    expect(remaining).toHaveLength(2);
    expect(remaining[0].textContent).toContain('Primero');
    expect(remaining[1].textContent).toContain('Siguiente');
    expect(screen.getByRole('button', { name: /Siguiente/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /Cierra ahora/ })).not.toBeInTheDocument();
  });

  it('moves the final pass to the empty state at its exact closing time', async () => {
    vi.setSystemTime(new Date('2026-10-20T15:59:59.900Z'));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);
    await screen.findByText('1 pase');
    vi.setSystemTime(new Date('2026-10-20T16:00:00Z'));
    await waitFor(() => expect(screen.getByText('0 pases')).toBeInTheDocument());
    expect(screen.getByRole('region', { name: 'Aún no tienes inscripciones.' })).toBeInTheDocument();
  });

  it('keeps chat unavailable until the chat module is connected', async () => {
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-2', eventName: 'Prisma' },
    ]);
    render(<MyPassesView />);
    const buttons = await screen.findAllByRole('button', {
      name: 'Abrir chat del taller',
    });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'Chat del taller próximamente');
    }
  });

  it('opens chat with the registration reference without selecting a different pass', async () => {
    const onOpenWorkshopChat = vi.fn();
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-2', eventName: 'Prisma' },
    ]);
    render(<MyPassesView onOpenWorkshopChat={onOpenWorkshopChat} />);
    const buttons = await screen.findAllByRole('button', {
      name: 'Abrir chat del taller',
    });
    expect(buttons[1]).toBeEnabled();
    expect(buttons[1].parentElement?.closest('button')).toBeNull();
    fireEvent.click(buttons[1]);
    expect(onOpenWorkshopChat).toHaveBeenCalledExactlyOnceWith('reg-2');
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows the QA location and 24-hour time consistently in passes', async () => {
    getMine.mockResolvedValue([
      {
        ...pass,
        location: 'Laboratorio 1, Facultad de Ciencias y Tecnología, UMSS',
      },
    ]);
    render(<MyPassesView />);
    await within(
      await screen.findByRole('complementary', {
        name: 'Detalle de la inscripción',
      }),
    ).findByText('reg-1');
    expect(
      screen.getAllByText('Laboratorio 1, Facultad de Ciencias y Tecnología'),
    ).toHaveLength(2);
    expect(screen.queryByText(/, UMSS$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/09:00 AM - 12:00 PM/).length).toBeGreaterThan(0);
  });

  it('muestra carga, datos reales y cambia el detalle al seleccionar otra inscripción', async () => {
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-2', eventName: 'Prisma', location: 'Lab 2' },
    ]);
    render(<MyPassesView />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(
      screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' }),
    ).not.toBeInTheDocument();
    await within(
      await screen.findByRole('complementary', {
        name: 'Detalle de la inscripción',
      }),
    ).findByText('reg-1');
    const passList = screen.getByRole('region', { name: 'Tus inscripciones' });
    const passDetail = screen.getByRole('complementary', {
      name: 'Detalle de la inscripción',
    });
    expect(passList.parentElement).toBe(passDetail.parentElement);
    expect(passList.parentElement).toHaveClass(
      'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
    );
    expect(
      passList.compareDocumentPosition(passDetail) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByText('Aula 101')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('2 pases')).toBeInTheDocument();
    expect(screen.getAllByText(/09:00 AM - 12:00 PM/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Prisma/ }));
    expect(
      within(
        screen.getByRole('complementary', {
          name: 'Detalle de la inscripción',
        }),
      ).getByText('reg-2'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Lab 2')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Prisma/ })).toHaveClass(
      'bg-accent',
      'text-accent-foreground',
    );
    expect(screen.getByRole('button', { name: /React/ })).toHaveClass(
      'bg-surface',
    );
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      within(
        screen.getByRole('complementary', {
          name: 'Detalle de la inscripción',
        }),
      ).queryByText('reg-1'),
    ).not.toBeInTheDocument();
  });

  it('muestra el estado vacío y acceso al catálogo', async () => {
    getMine.mockResolvedValue([]);
    render(<MyPassesView />);
    expect(
      await screen.findByRole('region', {
        name: 'Aún no tienes inscripciones.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 pases')).toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Vista ilustrativa de QR'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Explorar talleres disponibles' }),
    ).toHaveAttribute('href', '/events');
  });

  it('permite reintentar y muestra un único pase después de recuperarse', async () => {
    getMine
      .mockRejectedValueOnce(new Error('Debes iniciar sesión'))
      .mockResolvedValueOnce([pass]);
    render(<MyPassesView />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await within(
      await screen.findByRole('complementary', {
        name: 'Detalle de la inscripción',
      }),
    ).findByText('reg-1');
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            statusCode: 401,
            ok: false,
            code: 'UNAUTHENTICATED',
            detail: 'Sesión inválida',
            data: null,
          },
        },
      },
      'Inicia sesión para continuar',
    ],
    [
      {
        isAxiosError: true,
        response: {
          status: 403,
          data: {
            statusCode: 403,
            ok: false,
            code: 'USER_INACTIVE',
            detail: 'Usuario inactivo',
            data: null,
          },
        },
      },
      'Tu cuenta está inactiva',
    ],
    [
      { isAxiosError: true, response: { status: 500 } },
      'No pudimos completar la operación',
    ],
    [{ isAxiosError: true }, 'No pudimos completar la operación'],
    ['unknown', 'No pudimos completar la operación'],
  ])('presenta el error apropiado: %s', async (cause, message) => {
    getMine.mockRejectedValue(cause);
    render(<MyPassesView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(
      screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
  });

  it.each([true, false])(
    'cancela la consulta al desmontar sin actualizar la vista: %s',
    async (success) => {
      let resolve!: (items: (typeof pass)[]) => void;
      let reject!: (cause: unknown) => void;
      getMine.mockReturnValue(
        new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        }),
      );
      const { unmount } = render(<MyPassesView />);
      const signal = getMine.mock.calls[0][0];
      unmount();
      expect(signal?.aborted).toBe(true);
      await act(async () => {
        if (success) resolve([pass]);
        else reject(new Error('cancelled'));
      });
      await waitFor(() =>
        expect(screen.queryByText('React')).not.toBeInTheDocument(),
      );
    },
  );

  it('shows the location in the list and the registration ID in the selected detail', async () => {
    const longPass = {
      ...pass,
      date: '2099-10-20T00:00:00Z',
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventName: 'Taller'.repeat(80),
      location: 'Ubicación'.repeat(80),
    };
    getMine.mockResolvedValue([longPass]);
    render(<MyPassesView />);
    const card = await screen.findByRole('button', {
      name: new RegExp(longPass.eventName),
    });
    expect(within(card).getByText(longPass.location)).toBeInTheDocument();
    expect(within(card).getByText(longPass.id)).toBeInTheDocument();
    expect(within(card).getByText('ID Inscripción:')).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('complementary', {
          name: 'Detalle de la inscripción',
        }),
      ).getByText(longPass.id),
    ).toBeInTheDocument();
    expect(within(card).getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: 'Código QR del pase' }),
    ).toBeInTheDocument();
  });

  it('shows the cancel button next to chat only for confirmed registrations before Bolivia start time', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:59:59Z'));
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-pending', eventName: 'Pendiente', status: 'PENDING' },
    ]);
    render(<MyPassesView />);
    const cancelButtons = await screen.findAllByRole('button', {
      name: 'Cancelar inscripción',
    });
    expect(cancelButtons).toHaveLength(1);
    expect(cancelButtons[0]).toHaveTextContent('Cancelar');
    expect(cancelButtons[0]).toBeEnabled();
  });

  it('hides the cancel button at the exact Bolivia workshop start time without reloading', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:59:59.400Z'));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);
    expect(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    ).toBeInTheDocument();

    vi.setSystemTime(new Date('2026-10-20T13:00:00Z'));
    await waitFor(
      () =>
        expect(
          screen.queryByRole('button', { name: 'Cancelar inscripción' }),
        ).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
  });

  it('disables the cancel button when offline', async () => {
    const userToken = `h.${btoa(JSON.stringify({ sub: 'user-offline' }))}.s`;
    await saveAccessToken(userToken);
    await offlinePassesStore.save('user-offline', [
      { ...pass, qrToken: 'c'.repeat(64) },
    ]);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    onlineManager.setOnline(false);

    render(<MyPassesView />);
    const cancelButton = await screen.findByRole('button', {
      name: 'Cancelar inscripción',
    });
    expect(cancelButton).toBeDisabled();
    expect(cancelButton).toHaveAttribute('title', 'Requiere conexión a Internet');

    vi.restoreAllMocks();
    onlineManager.setOnline(true);
  });

  it('opens the cancel confirmation dialog when clicking Cancelar on an upcoming confirmed pass', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    getMine.mockResolvedValue([pass]);
    render(<MyPassesView />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    );

    expect(
      await screen.findByRole('dialog', {
        name: '¿Estás seguro de que deseas cancelar tu inscripción a este taller?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Esta acción liberará tu cupo y ya no podrás acceder a los detalles de este taller.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sí, cancelar' }),
    ).toBeInTheDocument();
  });

  it('closes the confirmation dialog without cancelling when clicking Volver', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    const onConfirmCancelRegistration = vi.fn();
    getMine.mockResolvedValue([pass]);
    render(
      <MyPassesView
        onConfirmCancelRegistration={onConfirmCancelRegistration}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Volver' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onConfirmCancelRegistration).not.toHaveBeenCalled();
  });

  it('closes the confirmation dialog without cancelling when pressing Escape or clicking Close', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    const onConfirmCancelRegistration = vi.fn();
    getMine.mockResolvedValue([pass]);
    render(
      <MyPassesView
        onConfirmCancelRegistration={onConfirmCancelRegistration}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onConfirmCancelRegistration).not.toHaveBeenCalled();
  });

  it('confirms cancellation and disables buttons while processing', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    let resolveConfirm: (() => void) | undefined;
    const onConfirmCancelRegistration = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    getMine.mockResolvedValue([pass]);
    render(
      <MyPassesView
        onConfirmCancelRegistration={onConfirmCancelRegistration}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sí, cancelar' }),
    );

    expect(onConfirmCancelRegistration).toHaveBeenCalledWith('reg-1');
    expect(
      await screen.findByRole('button', { name: 'Cancelando...' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled();

    resolveConfirm?.();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
it('cancels registration via backend, updates the pass list and count, removes offline copy, and shows dismissible green banner', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    const secondPass = {
      ...pass,
      id: 'reg-2',
      eventName: 'TypeScript Avanzado',
    };
    let currentList = [pass, secondPass];
    getMine.mockImplementation(async () => currentList);
    await saveOfflinePass(
      { ...pass, qrToken: 'a'.repeat(64) },
      'session',
    );
    cancelRegistration.mockImplementation(async (id) => {
      currentList = currentList.filter((item) => item.id !== id);
      return {
        id,
        eventId: 'evt-1',
        status: 'cancelled',
        qrToken: 'a'.repeat(64),
        registeredAt: '2026-10-01T10:00:00Z',
        cancelledAt: '2026-10-20T12:00:00Z',
      };
    });

    render(<MyPassesView />);
    expect(await screen.findByText('2 pases')).toBeInTheDocument();

    const cancelButtons = screen.getAllByRole('button', {
      name: 'Cancelar inscripción',
    });
    fireEvent.click(cancelButtons[0]);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Sí, cancelar' }),
    );

    await waitFor(() =>
      expect(cancelRegistration).toHaveBeenCalledWith('reg-1', 'session'),
    );
    expect(
      await screen.findByText(
        'Tu inscripción ha sido cancelada correctamente.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('1 pase')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Tus inscripciones' }),
      ).getByText('TypeScript Avanzado'),
    ).toBeInTheDocument();

    const offlineSnapshot = await offlinePassesStore.load('session');
    expect(offlineSnapshot?.passes ?? []).toHaveLength(0);

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar notificación' }),
    );
    expect(
      screen.queryByText('Tu inscripción ha sido cancelada correctamente.'),
    ).not.toBeInTheDocument();
  });

  it('shows an error alert and keeps the registration card when cancellation fails on the backend', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    getMine.mockResolvedValue([pass]);
    cancelRegistration.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          statusCode: 422,
          ok: false,
          code: 'CANCELLATION_NOT_ALLOWED',
          detail: 'Event already started',
          data: null,
        },
      },
    });

    render(<MyPassesView />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar inscripción' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sí, cancelar' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No es posible cancelar la inscripción una vez iniciado el evento.',
    );
    expect(
      screen.queryByText('Tu inscripción ha sido cancelada correctamente.'),
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Tus inscripciones' }),
      ).getByText('React'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 pase')).toBeInTheDocument();
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

  it('keeps saved QR available when switching history tabs offline without requests', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    goOffline();
    render(<MyPassesView />);
    await screen.findByRole('img', { name: 'Código QR del pase' });
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(await screen.findByText('El historial requiere conexión a Internet.')).toBeInTheDocument();
    expect(getFinished).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
    expect(await screen.findByRole('img', { name: 'Código QR del pase' })).toBeInTheDocument();
    expect(getMine).not.toHaveBeenCalled();
  });

  it('shows the saved passes and QR offline with the last update and blocked actions', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    goOffline();
    render(<MyPassesView onOpenWorkshopChat={vi.fn()} />);
    expect(
      await screen.findByText(
        'Sin conexión. Estás viendo tus pases guardados.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Última actualización: .*2026/),
    ).toBeInTheDocument();
    const panel = await screen.findByRole('complementary', {
      name: 'Detalle de la inscripción',
    });
    expect(
      await within(panel).findByRole('img', { name: 'Código QR del pase' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 pase')).toBeInTheDocument();
    const chat = screen.getByRole('button', { name: 'Abrir chat del taller' });
    expect(chat).toBeDisabled();
    expect(chat).toHaveAttribute('title', 'Requiere conexión a Internet');
    expect(
      screen.getByRole('link', { name: 'Explorar talleres' }),
    ).toHaveAttribute('href', '/events');
    expect(
      screen.getByText('El chat requiere conexión a Internet.'),
    ).toBeInTheDocument();
    expect(getMine).not.toHaveBeenCalled();
  });

  it('shows the same saved QR on reopening offline and removes it after reconnecting', async () => {
    getMine.mockResolvedValueOnce([pass]).mockResolvedValue([]);
    const getPass = vi.mocked(registrationsService.getPass);
    getPass.mockImplementationOnce(async (_id, signal, accessToken) => {
      if (!accessToken) throw new Error('Missing session');
      await saveOfflinePass(saved, accessToken, signal);
      return saved;
    });
    const onlineView = render(<MyPassesView />);
    const onlineQr = await screen.findByRole('img', {
      name: 'Código QR del pase',
    });
    const qrMarkup = onlineQr.outerHTML;
    expect(
      await screen.findByText('Disponible sin conexión'),
    ).toBeInTheDocument();
    onlineView.unmount();

    goOffline();
    render(<MyPassesView />);
    const restoredQr = await screen.findByRole('img', {
      name: 'Código QR del pase',
    });
    expect(restoredQr.outerHTML).toBe(qrMarkup);
    expect(getMine).toHaveBeenCalledTimes(1);
    expect(getPass).toHaveBeenCalledTimes(1);

    act(() => {
      vi.restoreAllMocks();
      window.dispatchEvent(new Event('online'));
      onlineManager.setOnline(true);
    });
    expect(
      await screen.findByText(/Se retiraron los pases/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Código QR del pase' }),
    ).not.toBeInTheDocument();
    expect((await offlinePassesStore.load('user-a'))?.passes).toEqual([]);
  });

  it('explains there is no saved copy instead of showing the empty registrations state', async () => {
    goOffline();
    render(<MyPassesView />);
    await screen.findByRole('heading', {
      name: 'No hay pases guardados en este dispositivo.',
    });
    expect(
      screen.getByText(/abre un pase confirmado para guardarlo/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reintentar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('ID Inscripción')).not.toBeInTheDocument();
  });

  it('marks only the passes saved on this device while online', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    getMine.mockResolvedValue([
      pass,
      { ...pass, id: 'reg-2', eventName: 'Prisma' },
    ]);
    render(<MyPassesView />);
    expect(
      await screen.findByText('Disponible sin conexión'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('button', { name: /React/ })).getByText(
        'Disponible sin conexión',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('button', { name: /Prisma/ })).queryByText(
        'Disponible sin conexión',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/pases guardados sin conexión/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Explorar talleres' }),
    ).toHaveAttribute('href', '/events');
  });

  it('falls back to the saved copy when the online refresh fails', async () => {
    await offlinePassesStore.save('user-a', [saved]);
    getMine
      .mockRejectedValueOnce(new Error('Sin servidor'))
      .mockResolvedValueOnce([pass]);
    vi.mocked(registrationsService.getPass).mockRejectedValue(
      new Error('Sin servidor'),
    );
    render(<MyPassesView />);
    expect(
      await screen.findByText(/No se pudieron actualizar tus pases/),
    ).toBeInTheDocument();
    const panel = screen.getByRole('complementary', {
      name: 'Detalle de la inscripción',
    });
    expect(
      await within(panel).findByRole('img', { name: 'Código QR del pase' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(
        screen.queryByText(/No se pudieron actualizar tus pases/),
      ).not.toBeInTheDocument(),
    );
    expect(getMine).toHaveBeenCalledTimes(2);
  });

  it('shows the no-copy message above the error when the server cannot be reached', async () => {
    getMine
      .mockRejectedValueOnce({ isAxiosError: true })
      .mockResolvedValueOnce([pass]);
    render(<MyPassesView />);
    const noCopy = await screen.findByRole('heading', {
      name: 'No hay pases guardados en este dispositivo.',
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No pudimos completar la operación');
    expect(
      noCopy.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByRole('region', { name: 'Aún no tienes inscripciones.' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await within(
      await screen.findByRole('complementary', {
        name: 'Detalle de la inscripción',
      }),
    ).findByText('reg-1');
    expect(
      screen.queryByRole('heading', {
        name: 'No hay pases guardados en este dispositivo.',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows only the server error when the server answered', async () => {
    getMine.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });
    render(<MyPassesView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos completar la operación',
    );
    expect(
      screen.queryByRole('heading', {
        name: 'No hay pases guardados en este dispositivo.',
      }),
    ).not.toBeInTheDocument();
  });
});
