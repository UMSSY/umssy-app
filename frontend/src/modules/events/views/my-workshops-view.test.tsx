import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useManagedWorkshops } from '../hooks/use-managed-workshops';
import { MyWorkshopsView } from './my-workshops-view';

vi.mock('../hooks/use-managed-workshops', () => ({ useManagedWorkshops: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const workshops = [
  { id: 'a', title: 'Manejo de IA', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: 'Aula 101' },
  { id: 'b', title: 'React básico', eventDate: '2025-06-24', startTime: '09:00', endTime: '12:00', location: 'Aula 202' },
];

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-11-13T12:00:00Z'), toFake: ['Date'] });
  vi.mocked(toast.info).mockClear();
  vi.mocked(useManagedWorkshops).mockReturnValue({ workshops, isLoading: false, error: null, retry: vi.fn() });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Mis talleres', () => {
  it('opens attendance 30 minutes before the workshop and blocks earlier access', () => {
    vi.setSystemTime(new Date('2027-06-24T17:29:59.999Z'));
    render(<MyWorkshopsView />);
    const link = screen.getByRole('link', { name: 'Registrar asistencias' });
    fireEvent.click(link);
    expect(toast.info).toHaveBeenCalledOnce();

    vi.mocked(toast.info).mockClear();
    vi.setSystemTime(new Date('2027-06-24T17:30:00.000Z'));
    fireEvent.click(link);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('shows a fixed toast before the attendance window and hides the action for finished workshops', () => {
    render(<MyWorkshopsView />);
    expect(screen.getByRole('button', { name: 'Activos (1)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Manejo de IA')).toBeInTheDocument();
    expect(screen.queryByText('React básico')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar asistencias' })).toHaveAttribute('href', '/events/my-workshops/a/attendance');
    fireEvent.click(screen.getByRole('link', { name: 'Registrar asistencias' }));
    expect(toast.info).toHaveBeenCalledWith('Taller fuera de horario. El registro se habilitará durante el horario de la sesión.');

    fireEvent.click(screen.getByRole('button', { name: 'Finalizados (1)' }));
    expect(screen.getByText('React básico')).toBeInTheDocument();
    expect(screen.queryByText('Manejo de IA')).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Talleres gestionados' })).queryByRole('link', { name: 'Registrar asistencias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar asistencias' })).not.toBeInTheDocument();
  });

  it('filters by title and distinguishes no results from no workshops', () => {
    render(<MyWorkshopsView />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar taller' }), { target: { value: 'otro' } });
    expect(screen.getByText('No se encontraron talleres con esa búsqueda.')).toBeInTheDocument();
    expect(screen.queryByText('Manejo de IA')).not.toBeInTheDocument();
  });

  it('shows the unavailable service as an error, never as an empty list', () => {
    const retry = vi.fn();
    vi.mocked(useManagedWorkshops).mockReturnValue({ workshops: [], isLoading: false, error: 'Consulta pendiente', retry });
    render(<MyWorkshopsView />);
    expect(screen.getByRole('alert')).toHaveTextContent('Consulta pendiente');
    expect(screen.queryByText('No tienes talleres activos.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
