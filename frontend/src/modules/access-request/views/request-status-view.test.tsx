import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRequestStatus } from '../hooks/use-request-status';
import type {
  RequestStatus,
  UseRequestStatusResult,
} from '../types/request-status.types';
import { RequestStatusView } from './request-status-view';

vi.mock('../hooks/use-request-status', () => ({
  useRequestStatus: vi.fn(),
}));

const mockedUseRequestStatus = vi.mocked(useRequestStatus);

function mockStatus(status: RequestStatus): void {
  const result: UseRequestStatusResult = {
    data: {
      requestCode: 'SOL-2026-0148',
      status,
      email: 'titulado@umss.edu',
      submittedAt: '2026-10-03T14:35:00-04:00',
      documentReceivedAt: '2026-10-03T14:35:00-04:00',
      reviewStartedAt: '2026-10-03T15:10:00-04:00',
      activatedAt: null,
    },
    isLoading: false,
    isError: false,
  };
  mockedUseRequestStatus.mockReturnValue(result);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RequestStatusView', () => {
  it('consulta el estado con el código recibido', () => {
    mockStatus('IN_REVIEW');
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(mockedUseRequestStatus).toHaveBeenCalledWith('SOL-2026-0148');
  });

  it('muestra el estado actual, el código y el correo de aviso', () => {
    mockStatus('IN_REVIEW');
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Revisión de la carrera' }),
    ).toBeTruthy();
    expect(screen.getByText('En revisión')).toBeTruthy();
    expect(screen.getByText('SOL-2026-0148')).toBeTruthy();
    expect(screen.getByText(/Estamos revisando tu solicitud/)).toBeTruthy();
    expect(screen.getByText('titulado@umss.edu')).toBeTruthy();
  });

  it('muestra la fecha y hora de la solicitud enviada en la línea de tiempo', () => {
    mockStatus('IN_REVIEW');
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(screen.getAllByText(/03\/10\/2026.*14:35/).length).toBeGreaterThan(0);
  });

  it('no muestra el mensaje de revisión cuando la solicitud fue aprobada', () => {
    mockStatus('APPROVED');
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(screen.getByText('Aprobada')).toBeTruthy();
    expect(screen.queryByText(/Estamos revisando tu solicitud/)).toBeNull();
  });

  it('resalta el estado rechazado en rojo oscuro', () => {
    mockStatus('REJECTED');
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(screen.getByText('Rechazada').className).toContain('text-[#B4050F]');
  });

  it('muestra un mensaje mientras carga', () => {
    mockedUseRequestStatus.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(screen.getByText(/Cargando el estado/)).toBeTruthy();
  });

  it('muestra una alerta cuando no se encuentra la solicitud', () => {
    mockedUseRequestStatus.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });
    render(<RequestStatusView requestCode="SOL-2026-0148" />);

    expect(screen.getByRole('alert').textContent).toContain(
      'No encontramos una solicitud con ese código',
    );
  });
});
