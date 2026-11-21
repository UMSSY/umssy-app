import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mentorCapacityService } from '../services/mentor-capacity.service';
import { MentorCapacityView } from './mentor-capacity-view';

const overview = {
  approvedGraduates: 340,
  percentage: 25,
  capacity: 85,
  activeMentors: 68,
  reservedOffers: 12,
  occupied: 80,
  available: 5,
  pendingRequests: 15,
};

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MentorCapacityView />
    </QueryClientProvider>,
  );
}

describe('MentorCapacityView', () => {
  beforeEach(() => {
    vi.spyOn(mentorCapacityService, 'getOverview').mockResolvedValue(overview);
    vi.spyOn(mentorCapacityService, 'getWaitingRequests').mockResolvedValue({
      items: [],
      totalItems: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
    vi.spyOn(mentorCapacityService, 'getOfferHistory').mockResolvedValue({
      items: [],
      totalItems: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra la capacidad y rechaza porcentajes decimales', async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(mentorCapacityService, 'updatePercentage');
    renderView();

    expect(await screen.findByText('340')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Límite calculado: 85')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(
      screen.getByLabelText('Número de cupos máximos (cantidad)'),
    ).toHaveValue('85');

    const input = screen.getByLabelText(
      'Porcentaje máximo de participación (%)',
    );
    await user.clear(input);
    await user.type(input, '25.5');
    await user.click(screen.getByRole('button', { name: 'Guardar límite' }));

    expect(
      screen.getByText('Ingresa un porcentaje entero entre 1 y 100.'),
    ).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it('actualiza la vista previa redondeando hacia arriba al cambiar el porcentaje', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'getOverview').mockResolvedValue({
      ...overview,
      approvedGraduates: 341,
    });
    renderView();

    const percentageInput = await screen.findByLabelText(
      'Porcentaje máximo de participación (%)',
    );
    const capacityInput = screen.getByLabelText(
      'Número de cupos máximos (cantidad)',
    );
    await user.clear(percentageInput);
    await user.type(percentageInput, '35');

    expect(capacityInput).toHaveValue('120');
  });

  it('sincroniza los cupos escritos con el porcentaje entero correspondiente', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'getOverview').mockResolvedValue({
      ...overview,
      approvedGraduates: 100,
      percentage: 25,
      capacity: 25,
    });
    renderView();

    expect(
      await screen.findByRole('heading', {
        name: 'Configuración de Capacidad Máxima',
      }),
    ).toBeInTheDocument();

    const percentageInput = screen.getByLabelText(
      'Porcentaje máximo de participación (%)',
    );
    const capacityInput = screen.getByLabelText(
      'Número de cupos máximos (cantidad)',
    );
    expect(capacityInput).toHaveValue('25');

    await user.clear(capacityInput);
    await user.type(capacityInput, '30');

    expect(percentageInput).toHaveValue('30');
    expect(capacityInput).toHaveValue('30');
  });

  it('informa si la cantidad no corresponde a ningún porcentaje entero', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'getOverview').mockResolvedValue({
      ...overview,
      approvedGraduates: 341,
    });
    renderView();

    const capacityInput = await screen.findByLabelText(
      'Número de cupos máximos (cantidad)',
    );
    await user.clear(capacityInput);
    await user.type(capacityInput, '121');

    expect(
      screen.getByText(
        'No hay un porcentaje entero que produzca exactamente esa cantidad de cupos.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Guardar límite' }),
    ).toBeDisabled();
  });

  it('mantiene la pantalla e informa si falla el guardado', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'updatePercentage').mockRejectedValue(
      new Error('Error de red'),
    );
    renderView();

    const input = await screen.findByLabelText(
      'Porcentaje máximo de participación (%)',
    );
    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: 'Guardar límite' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Error del servidor o de conexión/),
      ).toBeDefined();
    });
    expect(input).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Control de cupos' }),
    ).toBeDefined();
  });

  it('muestra la confirmación de guardado durante cuatro segundos', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'updatePercentage').mockResolvedValue({
      ...overview,
      percentage: 30,
      capacity: 102,
    });
    const successToast = vi.spyOn(toast, 'success');
    renderView();

    const input = await screen.findByLabelText(
      'Porcentaje máximo de participación (%)',
    );
    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: 'Guardar límite' }));

    await waitFor(() => {
      expect(successToast).toHaveBeenCalledWith(
        'Límite de participación actualizado.',
        { duration: 4000 },
      );
    });
  });

  it('pagina solicitudes con la query key de la página solicitada', async () => {
    const user = userEvent.setup();
    vi.spyOn(mentorCapacityService, 'getWaitingRequests').mockResolvedValue({
      items: [],
      totalItems: 11,
      page: 1,
      limit: 10,
      totalPages: 2,
    });
    renderView();

    await screen.findByText('11 registros');
    await user.click(screen.getAllByLabelText('Página siguiente')[0]);

    await waitFor(() => {
      expect(mentorCapacityService.getWaitingRequests).toHaveBeenCalledWith(
        2,
        expect.any(AbortSignal),
      );
    });
  });

  it('muestra fechas de solicitudes en la zona horaria de Bolivia', async () => {
    vi.spyOn(mentorCapacityService, 'getWaitingRequests').mockResolvedValue({
      items: [
        {
          id: 'request-1',
          firstName: 'Ana',
          lastName: 'Rojas',
          email: 'ana@example.com',
          queuedAt: '2026-11-20T14:30:00.000Z',
        },
      ],
      totalItems: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    renderView();

    expect(await screen.findByText(/10:30/)).toBeInTheDocument();
  });
});
