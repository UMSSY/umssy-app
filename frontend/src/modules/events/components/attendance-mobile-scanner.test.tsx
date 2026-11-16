import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttendanceMobileScanner } from './attendance-mobile-scanner';

vi.mock('./attendance-qr-camera', () => ({
  AttendanceQrCamera: ({ paused, onDetected }: { paused: boolean; onDetected: (value: string) => boolean }) => (
    <button type="button" disabled={paused} onClick={() => onDetected(`v1:${'a'.repeat(64)}`)}>Simular lectura QR</button>
  ),
}));
afterEach(cleanup);

describe('entrada de asistencia', () => {
  it('pauses after QR capture and resumes on request', () => {
    render(<AttendanceMobileScanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular lectura QR' }));
    expect(screen.getByRole('status')).toHaveTextContent('Referencia capturada');
    expect(screen.getByRole('button', { name: 'Simular lectura QR' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Escanear otro pase' }));
    expect(screen.getByRole('button', { name: 'Simular lectura QR' })).toBeEnabled();
  });

  it('accepts an inscription ID and a grouped short reference, and rejects scripts', () => {
    render(<AttendanceMobileScanner />);
    const input = screen.getByRole('textbox', { name: 'Ingresar referencia manualmente' });
    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Formato de pase no reconocido');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '7b8988fd-6818-4929-858b-4d83b72873cf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Referencia capturada');
    fireEvent.click(screen.getByRole('button', { name: 'Escanear otro pase' }));
    fireEvent.change(input, { target: { value: 'K7M4-R9TX-2Q8P' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Referencia capturada');
  });
});
