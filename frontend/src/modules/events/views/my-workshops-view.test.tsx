import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useManagedWorkshops } from '../hooks/use-managed-workshops';
import { MyWorkshopsView } from './my-workshops-view';

vi.mock('../hooks/use-managed-workshops', () => ({ useManagedWorkshops: vi.fn() }));

const workshops = [
  { id: 'a', title: 'Manejo de IA', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: 'Aula 101' },
  { id: 'b', title: 'React básico', eventDate: '2025-06-24', startTime: '09:00', endTime: '12:00', location: 'Aula 202' },
];

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-11-13T12:00:00Z'), toFake: ['Date'] });
  vi.mocked(useManagedWorkshops).mockReturnValue({ workshops, isLoading: false, error: null, retry: vi.fn() });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Mis talleres', () => {
  it('filters active and finished workshops and shows the corresponding notice', () => {
    render(<MyWorkshopsView />);
    expect(screen.getByRole('button', { name: 'Activos (1)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Manejo de IA')).toBeInTheDocument();
    expect(screen.queryByText('React básico')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Finalizados (1)' }));
    expect(screen.getByText('React básico')).toBeInTheDocument();
    expect(screen.queryByText('Manejo de IA')).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('region', { name: 'Talleres gestionados' })).getByRole('button', { name: 'Registrar asistencias' }));
    expect(screen.getByRole('status')).toHaveTextContent('Fuera de la ventana horaria');
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
