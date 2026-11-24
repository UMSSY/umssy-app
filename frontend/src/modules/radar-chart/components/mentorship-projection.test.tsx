import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorshipAvailability } from './mentorship-projection';
import type { RadarAreaScore } from '../types/radar-area-score.types';

const query = vi.hoisted(() => ({
  data: { totalItems: 2 },
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
}));
const directory = vi.hoisted(() => vi.fn());
vi.mock('@/modules/mentorship', () => ({
  useMentorDirectory: (params: unknown) => {
    directory(params);
    return query;
  },
}));
const areas: RadarAreaScore[] = [
  { id: 'desarrollo', name: 'Desarrollo', score: 4 },
  { id: 'cloud-devops', name: 'Cloud/DevOps', score: 5 },
  { id: 'data-ai', name: 'Data/AI', score: 5 },
  { id: 'qa', name: 'QA', score: 6 },
  { id: 'ciberseguridad', name: 'Ciberseguridad', score: 5 },
  { id: 'gobernanza-ti', name: 'Gobernanza TI', score: 5 },
];
beforeEach(() => {
  query.data = { totalItems: 2 };
  query.isPending = false;
  query.isError = false;
  vi.clearAllMocks();
});
afterEach(cleanup);
describe('proyección automática desde el radar', () => {
  it('consulta la especialidad disponible y muestra el total sin modificar los puntajes', () => {
    const original = structuredClone(areas);
    render(<MentorshipAvailability area={areas[0]} />);
    expect(directory).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'Desarrollo', available: true }),
    );
    expect(screen.getByText(/2 mentores disponibles/)).toBeInTheDocument();
    expect(areas).toEqual(original);
  });
  it('muestra el directorio vacio', () => {
    query.data.totalItems = 0;
    render(<MentorshipAvailability area={areas[0]} />);
    expect(screen.getByText(/No hay mentores disponibles/)).toBeInTheDocument();
  });
  it('no presenta una proyección mientras carga y distingue errores de un directorio vacío', () => {
    query.isPending = true;
    const view = render(<MentorshipAvailability area={areas[0]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Resumen de proyecci\u00f3n'),
    ).not.toBeInTheDocument();
    query.isPending = false;
    query.isError = true;
    view.rerender(<MentorshipAvailability area={areas[0]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.queryByText(/No hay mentores disponibles/),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Reintentar consulta' }),
    );
    expect(query.refetch).toHaveBeenCalledOnce();
  });
  it('usa la respuesta del área nueva al cambiar de selección', () => {
    const view = render(<MentorshipAvailability area={areas[0]} />);
    query.data = { totalItems: 0 };
    view.rerender(<MentorshipAvailability area={areas[3]} />);
    expect(directory).toHaveBeenLastCalledWith(
      expect.objectContaining({ area: 'QA' }),
    );
    expect(screen.getByText(/No hay mentores disponibles/)).toBeInTheDocument();
  });
});
