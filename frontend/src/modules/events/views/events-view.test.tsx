import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EventsView } from './events-view';

afterEach(() => {
  cleanup();
});

describe('EventsView', () => {
  it('renderiza el encabezado principal y el resumen de talleres', () => {
    render(<EventsView />);

    expect(
      screen.getByRole('heading', { name: /talleres disponibles/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/6 talleres/i)).toBeInTheDocument();
  });

  it('muestra la barra de busqueda y los chips de categorias del mockup', () => {
    render(<EventsView />);

    const filters = screen.getByRole('search', { name: /filtros de talleres/i });

    expect(filters).toBeInTheDocument();
    expect(screen.getByText(/buscar taller/i)).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(within(filters).getByText('IA & Datos')).toBeInTheDocument();
  });

  it('renderiza el listado de talleres con estado lleno y el panel de seleccion', () => {
    render(<EventsView />);

    expect(screen.getByText('Desarrollo Web con React')).toBeInTheDocument();
    expect(screen.getByText('Lleno')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /selecciona un taller/i }),
    ).toBeInTheDocument();
  });
});