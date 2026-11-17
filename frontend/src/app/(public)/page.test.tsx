import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventsService } from '@/modules/events';
import Home from './page';

const queryClients = new Set<ReturnType<typeof render>['client']>();

afterEach(() => {
  cleanup();
  for (const client of queryClients) client.clear();
  queryClients.clear();
  vi.restoreAllMocks();
});

describe('Public landing', () => {
  it('offers discovery before requesting an account', async () => {
    vi.spyOn(eventsService, 'getEvents').mockResolvedValue({
      data: [],
      page: 1,
      offset: 0,
    });
    queryClients.add(render(<Home />).client);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tu comunidad.',
    );
    expect(
      screen.getByRole('link', { name: 'Explorar talleres' }),
    ).toHaveAttribute('href', '#workshops');
    expect(
      await screen.findByText('Aún no hay talleres publicados. Vuelve pronto.'),
    ).toBeInTheDocument();
  });
  it('offers a retry when published workshops cannot be loaded', async () => {
    const getEvents = vi
      .spyOn(eventsService, 'getEvents')
      .mockRejectedValue(new Error('offline'));
    queryClients.add(render(<Home />).client);
    expect(
      await screen.findByText('No pudimos cargar los talleres.'),
    ).toBeInTheDocument();
    expect(getEvents).toHaveBeenCalledTimes(1);
    getEvents.mockResolvedValue({
      data: [
        {
          id: 'workshop-1',
          title: 'Taller de pruebas',
          category: { id: 'technology', name: 'Tecnología' },
          description: 'Sesión práctica.',
          instructorName: 'Ana',
          eventDate: '2026-11-17',
          startTime: '09:00',
          endTime: '12:00',
          location: 'Aula 1',
          capacity: 20,
          availableSpots: 10,
          registrationCount: 10,
          statusId: 'open',
          modalityId: 'onsite',
        },
      ],
      page: 1,
      offset: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }));
    expect(
      await screen.findByRole('heading', { name: 'Taller de pruebas' }),
    ).toBeInTheDocument();
    expect(getEvents).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole('button', { name: 'Volver a intentar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Botón de ejemplo')).not.toBeInTheDocument();
  });
});
