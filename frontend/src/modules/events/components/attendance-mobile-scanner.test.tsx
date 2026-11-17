import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AttendanceMobileScanner } from './attendance-mobile-scanner';
import { attendanceCheckInService } from '../services/attendance-check-in.service';

const WORKSHOP_ID = '914f52b0-47f0-49b0-925a-d6783861693a';
const QR = `v1:${'a'.repeat(64)}`;

function renderScanner() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><AttendanceMobileScanner workshopId={WORKSHOP_ID} /></QueryClientProvider>);
}

vi.mock('./attendance-qr-camera', () => ({
  AttendanceQrCamera: ({
    paused,
    onDetected,
  }: {
    paused: boolean;
    onDetected: (value: string) => boolean;
  }) => (
    <button type="button" disabled={paused} onClick={() => onDetected(QR)}>
      Simular lectura QR
    </button>
  ),
}));
vi.mock('../services/attendance-check-in.service', () => ({
  attendanceCheckInService: { checkIn: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('entrada de asistencia', () => {
  it('sends one QR to the selected workshop, pauses while verifying and resumes after success', async () => {
    let finish!: (value: 'registered') => void;
    vi.mocked(attendanceCheckInService.checkIn).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderScanner();
    fireEvent.click(screen.getByRole('button', { name: 'Simular lectura QR' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Verificando entrada...',
    );
    expect(
      screen.getByRole('button', { name: 'Simular lectura QR' }),
    ).toBeDisabled();
    await waitFor(() => expect(attendanceCheckInService.checkIn).toHaveBeenCalledExactlyOnceWith(
      WORKSHOP_ID,
      'a'.repeat(64),
      expect.any(AbortSignal),
    ));
    await act(async () => finish('registered'));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Asistencia registrada',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Escanear siguiente' }));
    expect(
      screen.getByRole('button', { name: 'Simular lectura QR' }),
    ).toBeEnabled();
  });

  it('accepts a registration UUID and rejects scripts or unsupported short codes before sending', async () => {
    vi.mocked(attendanceCheckInService.checkIn).mockResolvedValue('duplicate');
    renderScanner();
    const input = screen.getByRole('textbox', {
      name: 'Ingresar referencia manualmente',
    });
    for (const value of ['<script>alert(1)</script>', 'K7M4-R9TX-2Q8P']) {
      fireEvent.change(input, { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Formato de pase no reconocido',
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Escanear nuevamente' }),
      );
    }
    expect(attendanceCheckInService.checkIn).not.toHaveBeenCalled();
    const registrationId = '7b8988fd-6818-4929-858b-4d83b72873cf';
    fireEvent.change(input, { target: { value: registrationId } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Asistencia ya registrada',
      ),
    );
    expect(attendanceCheckInService.checkIn).toHaveBeenCalledWith(
      WORKSHOP_ID,
      registrationId,
      expect.any(AbortSignal),
    );
    expect(input).toHaveValue('');
  });

  it('maps a cancelled pass to an invalid result without displaying the server detail', async () => {
    vi.mocked(attendanceCheckInService.checkIn).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { code: 'ATTENDANCE_PASS_CANCELLED', detail: QR },
      },
    });
    renderScanner();
    fireEvent.click(screen.getByRole('button', { name: 'Simular lectura QR' }));
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'Pase inválido - Inscripción cancelada',
      ),
    );
    expect(screen.getByRole('dialog')).not.toHaveTextContent(QR);
  });

});
