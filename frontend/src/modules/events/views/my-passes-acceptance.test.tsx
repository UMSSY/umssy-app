import '@/shared/testing/indexed-db.mock';
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosAdapter } from 'axios';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { apiClient } from '@/shared/services/api-client';
import {
  clearAccessToken,
  saveAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { MyPassesView } from './my-passes-view';

const originalAdapter = apiClient.defaults.adapter;
const originalUrl = apiClient.defaults.baseURL;
const registration = (n: number, date = '2026-08-10T00:00:00Z') => ({
  id: `reg-${n}`,
  eventId: `event-${n}`,
  eventName: `Taller ${n}`,
  date,
  startTime: '1970-01-01T09:00:00Z',
  endTime: '1970-01-01T12:00:00Z',
  location: 'Aula 101',
  status: 'Confirmada',
  registeredAt: '2026-08-01T00:00:00Z',
  cancelledAt: null,
});
let current = [registration(1), registration(2)];
let history = Array.from({ length: 12 }, (_, n) => registration(n + 3));
let failList = false;
const transport = vi.fn<AxiosAdapter>(async (config) => {
  expect(config.headers.get('Authorization')).toBe('Bearer hu13-session');
  if (failList && !config.params?.scope) {
    failList = false;
    throw new AxiosError('Error de red', 'ERR_NETWORK', config);
  }
  let data: unknown;
  if (config.url?.endsWith('/pass')) {
    const item = current.find((row) => config.url?.includes(`/${row.id}/`));
    if (!item) throw new Error('Pase inexistente');
    data = {
      id: item.id,
      qrToken: (item.id === 'reg-1' ? 'a' : 'b').repeat(64),
      status: { title: item.status },
      event: {
        title: item.eventName,
        eventDate: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
      },
    };
  } else if (config.params?.scope === 'finished') {
    const page = Number(config.params.page);
    data = {
      items: history.slice((page - 1) * 10, page * 10),
      total: history.length,
      totalPages: Math.ceil(history.length / 10),
      limit: 10,
    };
  } else data = current;
  return {
    config,
    headers: {},
    status: 200,
    statusText: 'OK',
    data: { statusCode: 200, data, ok: true, detail: 'Operación exitosa' },
  };
});

beforeEach(async () => {
  vi.useFakeTimers({ now: new Date('2026-10-19T12:00:00Z'), toFake: ['Date'] });
  current = [
    registration(1, '2026-10-20T00:00:00Z'),
    registration(2, '2026-10-21T00:00:00Z'),
  ];
  history = Array.from({ length: 12 }, (_, n) => registration(n + 3));
  failList = false;
  transport.mockClear();
  apiClient.defaults.adapter = transport;
  apiClient.defaults.baseURL = 'https://hu13.test/api';
  await saveAccessToken('hu13-session');
});
afterEach(() => {
  cleanup();
  clearAccessToken();
  apiClient.defaults.adapter = originalAdapter;
  apiClient.defaults.baseURL = originalUrl;
  vi.useRealTimers();
});

it('consumes optimized responses, preserves QR and chat, and moves finished passes into paginated history', async () => {
  const chat = vi.fn();
  renderWithQuery(<MyPassesView onOpenWorkshopChat={chat} />);
  expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  expect(await screen.findByText('2 pases')).toBeInTheDocument();
  const firstQr = (
    await screen.findByRole('img', { name: 'Código QR del pase' })
  ).outerHTML;
  fireEvent.click(screen.getByRole('button', { name: /Taller 2/ }));
  await waitFor(() =>
    expect(
      screen.getByRole('img', { name: 'Código QR del pase' }).outerHTML,
    ).not.toBe(firstQr),
  );
  expect(
    within(
      screen.getByRole('complementary', { name: 'Detalle de la inscripción' }),
    ).getByText('reg-2'),
  ).toBeInTheDocument();
  fireEvent.click(
    within(
      screen.getByRole('region', { name: 'Tus inscripciones' }),
    ).getAllByRole('button', { name: /chat/i })[1],
  );
  expect(chat).toHaveBeenCalledWith('reg-2');
  // Simula la siguiente respuesta del backend tras finalizar el primer taller.
  history = [current[0], ...history];
  current = current.slice(1);
  vi.setSystemTime(new Date('2026-10-20T16:00:00Z'));
  const passRequests = transport.mock.calls.filter(([config]) =>
    config.url?.endsWith('/pass'),
  ).length;
  fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
  expect(await screen.findByText('13 pases')).toBeInTheDocument();
  expect(
    screen.queryByRole('img', { name: 'Código QR del pase' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
  await screen.findByText('Taller 14');
  const titles = screen
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
  expect(titles).toEqual(history.map((item) => item.eventName));
  expect(new Set(titles).size).toBe(13);
  expect(
    screen.queryByRole('button', { name: 'Cargar más' }),
  ).not.toBeInTheDocument();
  expect(
    transport.mock.calls.filter(([config]) => config.url?.endsWith('/pass')),
  ).toHaveLength(passRequests);
  fireEvent.click(screen.getByRole('tab', { name: 'Vigentes' }));
  expect(await screen.findByText('1 pase')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Taller 1\b/ }),
  ).not.toBeInTheDocument();
  expect(
    await screen.findByRole('img', { name: 'Código QR del pase' }),
  ).toBeInTheDocument();
});

it('recovers from a transport error into the empty state without inventing passes', async () => {
  current = [];
  failList = true;
  renderWithQuery(<MyPassesView />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(
    await screen.findByRole('region', { name: 'Aún no tienes inscripciones.' }),
  ).toBeInTheDocument();
  expect(screen.getByText('0 pases')).toBeInTheDocument();
  expect(
    screen.queryByRole('img', { name: 'Código QR del pase' }),
  ).not.toBeInTheDocument();
});
