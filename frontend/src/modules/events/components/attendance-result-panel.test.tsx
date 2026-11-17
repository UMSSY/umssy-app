import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttendanceResultPanel } from './attendance-result-panel';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';

afterEach(cleanup);

describe('panel de resultado de asistencia', () => {
  it.each([
    [{ kind: 'registered' }, 'Asistencia registrada'],
    [{ kind: 'duplicate' }, 'Asistencia ya registrada'],
    [{ kind: 'invalid' }, 'Pase inválido'],
    [{ kind: 'error' }, 'No se pudo verificar la entrada'],
  ] as const)('shows %s and resumes by touching outside', (state, title) => {
    const onDismiss = vi.fn();
    render(<AttendanceResultPanel state={state as AttendancePanelState} onDismiss={onDismiss} />);
    expect(screen.getByRole('dialog')).toHaveTextContent(title);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar resultado y volver a escanear' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('keeps verifying open and blocks duplicate scans until a result is shown', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<AttendanceResultPanel state={{ kind: 'verifying' }} onDismiss={onDismiss} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar resultado y volver a escanear' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar resultado y volver a escanear' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(<AttendanceResultPanel state={{ kind: 'registered' }} onDismiss={onDismiss} />);
    expect(screen.getByRole('button', { name: 'Ver registro del taller' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('confirms a valid pass after registration', () => {
    render(<AttendanceResultPanel state={{ kind: 'registered' }} onDismiss={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('Pase válido');
  });
});
