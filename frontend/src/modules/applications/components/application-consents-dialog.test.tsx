import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { applicationService } from '../services/application.service';
import { buildApplication } from '../testing/application-fixtures';
import { ApplicationConsentsDialog } from './application-consents-dialog';

vi.mock('../services/application.service', () => ({
  applicationService: { getConsents: vi.fn(), updateConsents: vi.fn() },
}));
const initial = {
  id: 'application-1',
  consent: true,
  consentCv: true,
  consentContact: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(applicationService.getConsents).mockResolvedValue(initial);
});
afterEach(cleanup);

describe('Gestión de permisos', () => {
  it.each(['Compartir radar', 'Compartir CV', 'Compartir correo y teléfono'])(
    'revoca únicamente %s después de guardar',
    async (label) => {
      vi.mocked(applicationService.updateConsents).mockImplementation(
        async (value) => value,
      );
      renderWithQuery(
        <ApplicationConsentsDialog
          application={buildApplication({ id: initial.id })}
        />,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Gestionar permisos' }),
      );
      fireEvent.click(await screen.findByRole('checkbox', { name: label }));
      expect(applicationService.updateConsents).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Guardar permisos' }));
      const field =
        label === 'Compartir radar'
          ? 'consent'
          : label === 'Compartir CV'
            ? 'consentCv'
            : 'consentContact';
      await waitFor(() =>
        expect(applicationService.updateConsents).toHaveBeenCalledWith(
          { ...initial, [field]: false },
          expect.anything(),
        ),
      );
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Permisos actualizados',
      );
    },
  );
  it('no ofrece cambios en postulaciones retiradas', () => {
    renderWithQuery(
      <ApplicationConsentsDialog
        application={buildApplication({ status: 'Retirada' })}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(applicationService.getConsents).not.toHaveBeenCalled();
  });
  it('mantiene el formulario y muestra error si no se pudo guardar', async () => {
    vi.mocked(applicationService.updateConsents).mockRejectedValue(
      new Error('unavailable'),
    );
    renderWithQuery(
      <ApplicationConsentsDialog application={buildApplication()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gestionar permisos' }));
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Compartir CV' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar permisos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron guardar',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Compartir CV' }),
    ).not.toBeChecked();
    expect(
      screen.queryByText('Permisos actualizados.'),
    ).not.toBeInTheDocument();
  });
  it('no concede permisos ni permite guardar cuando la consulta falla', async () => {
    vi.mocked(applicationService.getConsents).mockRejectedValue(
      new Error('unavailable'),
    );
    renderWithQuery(
      <ApplicationConsentsDialog application={buildApplication()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gestionar permisos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar',
    );
    expect(
      screen.queryByRole('button', { name: 'Guardar permisos' }),
    ).not.toBeInTheDocument();
    expect(applicationService.updateConsents).not.toHaveBeenCalled();
  });
});
