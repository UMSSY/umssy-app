import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { PendingParticipation } from './pending-participation';
import * as participationService from '../../services/mentor-participation.service';

vi.mock('@/modules/mentorship/hooks/use-mentorship-catalogs', () => ({
  useMentorshipCatalogs: () => ({
    technicalAreas: [
      { id: 'area-backend', name: 'Backend' },
      { id: 'area-database', name: 'Bases de Datos' },
    ],
    orientationTypes: [
      { id: 'orientation-technical', name: 'Orientación técnica' },
      { id: 'orientation-cv', name: 'Revisión de CV' },
    ],
    isTechnicalAreasLoading: false,
    isOrientationTypesLoading: false,
  }),
}));

const pendingRequest: import('../../types/mentor-participation-request.types').MentorParticipationRequest =
  {
    id: 'request-1',
    userId: 'user-1',
    status: 'PENDING',
    queuedAt: '2026-10-26T15:00:00.000Z',
    createdAt: '2026-10-26T15:00:00.000Z',
    technicalAreaIds: ['area-backend'],
    orientationTypeIds: ['orientation-technical'],
  };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Participación pendiente HU7-2', () => {
  it('apila el estado en móvil y agrupa las acciones al pasar a fila', () => {
    renderWithQuery(<PendingParticipation request={pendingRequest} />);

    const details = screen.getByRole('button', { name: 'Ver detalle' });
    const cancel = screen.getByRole('button', { name: 'Cancelar cupo' });
    const actions = details.parentElement;
    const statusRow = actions?.parentElement;

    expect(actions).toBe(cancel.parentElement);
    expect(actions).toHaveClass('flex', 'flex-wrap', 'gap-2', 'md:shrink-0');
    expect(statusRow).toHaveClass(
      'flex',
      'flex-col',
      'md:flex-row',
      'md:flex-wrap',
    );
    expect(statusRow?.firstElementChild).toContainElement(
      screen.getByRole('heading', { name: 'Estado de participación' }),
    );
    expect(statusRow?.lastElementChild).toBe(actions);
  });

  it.each([
    ['Áreas técnicas', 'Editar áreas técnicas', 'Backend'],
    [
      'Tipos de orientación',
      'Editar tipos de orientación',
      'Orientación técnica',
    ],
  ])(
    'adapta el encabezado de %s y mantiene su acción de edición',
    (heading, action, preference) => {
      renderWithQuery(<PendingParticipation request={pendingRequest} />);

      const edit = screen.getByRole('button', { name: action });
      const header = screen.getByRole('heading', {
        name: heading,
      }).parentElement;

      expect(header).toBe(edit.parentElement);
      expect(header).toHaveClass(
        'flex',
        'flex-col',
        'items-start',
        'sm:flex-row',
        'sm:items-center',
        'sm:justify-between',
      );
      expect(edit).toHaveClass(
        'h-auto',
        'min-h-9',
        'max-w-full',
        'py-2',
        'whitespace-normal',
      );
      expect(screen.getByText(preference)).toHaveClass('wrap-anywhere');

      fireEvent.click(edit);
      const dialog = screen.getByRole('dialog', {
        name: 'Modificar solicitud pendiente',
      });
      expect(dialog).toBeVisible();
      expect(within(dialog).getByText(preference)).toHaveClass('wrap-anywhere');
    },
  );

  it('muestra la solicitud pendiente y sus preferencias', () => {
    renderWithQuery(<PendingParticipation request={pendingRequest} />);

    expect(
      screen.getByRole('heading', { name: 'Estado de participación' }),
    ).toBeInTheDocument();

    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Orientación técnica')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Editar áreas técnicas' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Cancelar cupo' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Editar tipos de orientación' }),
    ).toBeInTheDocument();
  });

  it('permite abrir el formulario para modificar preferencias', () => {
    renderWithQuery(<PendingParticipation request={pendingRequest} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar áreas técnicas' }),
    );

    expect(
      screen.getByRole('dialog', {
        name: 'Modificar solicitud pendiente',
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('checkbox', { name: 'Backend' })).toBeChecked();

    expect(
      screen.getByRole('checkbox', { name: 'Orientación técnica' }),
    ).toBeChecked();
  });

  it('actualiza las preferencias usando el servicio real', async () => {
    const update = vi
      .spyOn(participationService.mentorParticipationService, 'update')
      .mockResolvedValue({
        ...pendingRequest,
        technicalAreaIds: ['area-database'],
      });

    renderWithQuery(<PendingParticipation request={pendingRequest} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar tipos de orientación' }),
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Backend' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Bases de Datos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        technicalAreaIds: ['area-database'],
        orientationTypeIds: ['orientation-technical'],
      });
    });
  });

  it('abre la confirmación antes de cancelar', () => {
    renderWithQuery(<PendingParticipation request={pendingRequest} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cupo' }));

    expect(
      screen.getByRole('dialog', {
        name: '¿Cancelar solicitud de cupo?',
      }),
    ).toBeInTheDocument();
  });

  it('cancela la solicitud mediante el servicio', async () => {
    const onCancelled = vi.fn();
    const cancel = vi
      .spyOn(participationService.mentorParticipationService, 'cancel')
      .mockResolvedValue({
        ...pendingRequest,
        status: 'CANCELLED',
      });

    renderWithQuery(
      <PendingParticipation
        request={pendingRequest}
        onCancelled={onCancelled}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cupo' }));

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      }),
    );

    await waitFor(() => {
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(onCancelled).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByText('Solicitud cancelada correctamente'),
    ).not.toBeInTheDocument();
  });

  it('muestra el detalle pendiente y permite volver sin historial', () => {
    renderWithQuery(
      <PendingParticipation
        request={{ ...pendingRequest, email: 'titulado@umssy.test' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(
      screen.getByRole('dialog', { name: 'Solicitud pendiente' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Solicitud enviada hace/)).toBeInTheDocument();
    expect(screen.getByText('titulado@umssy.test')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Ver historial' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(
      screen.queryByRole('dialog', { name: 'Solicitud pendiente' }),
    ).not.toBeInTheDocument();
  });
});
