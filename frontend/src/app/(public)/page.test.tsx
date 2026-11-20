import { fireEvent, screen } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventsService } from '@/modules/events';
import Home from './page';
afterEach(() => vi.restoreAllMocks());
describe('Public landing', () => {
  it('offers discovery before requesting an account', async () => {
    vi.spyOn(eventsService, 'getEvents').mockResolvedValue({
      data: [],
      page: 1,
      offset: 0,
    });
    render(<Home />);
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
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ data: [], page: 1, offset: 0 });
    render(<Home />);
    expect(
      await screen.findByText('No pudimos cargar los talleres.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }));
    expect(
      await screen.findByText('Aún no hay talleres publicados. Vuelve pronto.'),
    ).toBeInTheDocument();
    expect(getEvents).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole('button', { name: 'Volver a intentar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Botón de ejemplo')).not.toBeInTheDocument();
  });
});
