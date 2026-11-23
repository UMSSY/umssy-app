
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RadarNotificationPopup } from './radar-notification-popup';
import type { RadarNotification } from '../types/radar-notification.types';

const mocks = vi.hoisted(() => ({
  socketOn: vi.fn(),
  socketOff: vi.fn(),
  mutateAsync: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/modules/notifications/services/notifications-socket', () => ({
  getNotificationsSocket: () => ({
    on: mocks.socketOn,
    off: mocks.socketOff,
  }),
}));

vi.mock('../hooks/use-radar-integration-queries', () => ({
  radarQueryKeys: {
    notifications: () => ['radar-integration', 'notifications'],
  },
  useRadarNotifications: vi.fn(),
  useRadarNotificationMutations: () => ({
    openNotification: {
      mutateAsync: mocks.mutateAsync,
      isPending: false,
    },
  }),
}));

const snapshotId = '33333333-3333-4333-8333-333333333333';
const actionUrl = `/profile/radar?snapshot=${snapshotId}`;

const notification: RadarNotification = {
  id: 'notification-1',
  snapshotId,
  message: 'Tu radar se ha actualizado',
  version: 3,
  createdAt: '2026-11-09T10:31:00.000Z',
  readAt: null,
};

function renderPopup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  queryClient.setQueryData(
    ['radar-integration', 'notifications'],
    [notification],
  );

  vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RadarNotificationPopup />
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}

type TestNotificationPayload = {
  typeCode?: string;
  title: string;
  body: string;
  actionUrl?: string;
};

function emitNotification(payload: TestNotificationPayload) {
  const handler = mocks.socketOn.mock.calls[0]?.[1] as
    | ((eventPayload: TestNotificationPayload) => void)
    | undefined;

  handler?.(payload);
}

describe('RadarNotificationPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it('permanece oculto cuando no hay notificaciones nuevas', () => {
    renderPopup();

    expect(
      screen.queryByText('Centro de notificaciones'),
    ).not.toBeInTheDocument();
  });

  it('ignora eventos que no pertenecen al Radar', () => {
    renderPopup();

    emitNotification({
      typeCode: 'MESSAGE_RECEIVED',
      title: 'Nuevo mensaje',
      body: 'Tienes un mensaje nuevo',
      actionUrl: '/messages',
    });

    expect(
      screen.queryByText('Centro de notificaciones'),
    ).not.toBeInTheDocument();
  });

  it('muestra la notificación correspondiente al snapshot recibido', async () => {
    renderPopup();

    emitNotification({
      typeCode: 'RADAR_PUBLISHED',
      title: 'Nueva versión del Radar publicada',
      body: 'Tu Radar se actualizó',
      actionUrl,
    });

    await waitFor(() => {
      expect(
        screen.getByText('Centro de notificaciones'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Tu radar se ha actualizado'),
    ).toBeInTheDocument();
  });

  it('abre el Radar y marca la notificación como leída', async () => {
    renderPopup();

    emitNotification({
      typeCode: 'RADAR_PUBLISHED',
      title: 'Nueva versión del Radar publicada',
      body: 'Tu Radar se actualizó',
      actionUrl,
    });

    const openButton = await screen.findByText('Ver mi radar →');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith(notification.id);
      expect(mocks.routerPush).toHaveBeenCalledWith(actionUrl);
    });
  });

  it('cierra el popup al pulsar el botón de cerrar', async () => {
    renderPopup();

    emitNotification({
      typeCode: 'RADAR_PUBLISHED',
      title: 'Nueva versión del Radar publicada',
      body: 'Tu Radar se actualizó',
      actionUrl,
    });

    await screen.findByText('Centro de notificaciones');

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar notificación' }),
    );

    expect(
      screen.queryByText('Centro de notificaciones'),
    ).not.toBeInTheDocument();
  });
});