
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RadarNotificationCard } from './radar-notification-card';
import type { RadarNotification } from '../types/radar-notification.types';

const notification: RadarNotification = {
  id: 'notification-1',
  snapshotId: '33333333-3333-4333-8333-333333333333',
  message: 'Tu radar se ha actualizado',
  version: 3,
  createdAt: '2026-11-09T10:31:00.000Z',
  readAt: null,
};

describe('RadarNotificationCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra el contenido y la fecha de la notificación', () => {
    render(
      <RadarNotificationCard
        notification={notification}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        isOpening={false}
      />,
    );

    expect(screen.getByText('Centro de notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Radar de afinidad')).toBeInTheDocument();
    expect(screen.getByText('Tu radar se ha actualizado')).toBeInTheDocument();
    expect(screen.getByText(/versión 3/)).toBeInTheDocument();
    expect(screen.getByText('Ver mi radar →')).toBeInTheDocument();

    expect(screen.getByRole('time')).toHaveAttribute(
      'dateTime',
      notification.createdAt,
    );
  });

  it('indica cuando la notificación no ha sido leída', () => {
    render(
      <RadarNotificationCard
        notification={notification}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        isOpening={false}
      />,
    );

    expect(screen.getByLabelText('No leída')).toBeInTheDocument();
  });

  it('no muestra el indicador cuando la notificación ya fue leída', () => {
    render(
      <RadarNotificationCard
        notification={{ ...notification, readAt: '2026-11-09T11:00:00.000Z' }}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        isOpening={false}
      />,
    );

    expect(screen.queryByLabelText('No leída')).not.toBeInTheDocument();
  });

  it('ejecuta la acción de cerrar', () => {
    const onClose = vi.fn();

    render(
      <RadarNotificationCard
        notification={notification}
        onClose={onClose}
        onOpen={vi.fn()}
        isOpening={false}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar notificación' }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta la acción de abrir', () => {
    const onOpen = vi.fn();

    render(
      <RadarNotificationCard
        notification={notification}
        onClose={vi.fn()}
        onOpen={onOpen}
        isOpening={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver mi radar →' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('deshabilita la acción mientras se abre el radar', () => {
    render(
      <RadarNotificationCard
        notification={notification}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        isOpening
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Abriendo radar...' }),
    ).toBeDisabled();
  });
});
