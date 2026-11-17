import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MentorshipProjection } from './mentorship-projection';
import type { RadarAreaScore } from '../types/radar-area-score.types';

const query = vi.hoisted(() => ({
  data: { totalItems: 2 },
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
}));
const directory = vi.hoisted(() => vi.fn());
vi.mock('@/modules/mentorship/hooks/use-mentor-directory', () => ({
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
  it('consulta la especialidad disponible y proyecta un solo punto sin controles ni mutaciones', () => {
    const original = structuredClone(areas);
    render(<MentorshipProjection area={areas[0]} areas={areas} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
    expect(directory).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'Desarrollo', available: true }),
    );
    expect(
      screen.getByLabelText('Resumen de proyecci\u00f3n').textContent,
    ).toContain('4 → 5 / 10');
    expect(
      screen.getByText(/Promedio global proyectado/).textContent,
    ).toContain('5,17 / 10');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(areas).toEqual(original);
  });
  it('conserva el puntaje cuando no existen mentores', () => {
    query.data.totalItems = 0;
    render(<MentorshipProjection area={areas[0]} areas={areas} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
    expect(screen.getByText(/No hay mentores disponibles/)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Resumen de proyecci\u00f3n').textContent,
    ).toContain('4 → 4 / 10');
  });
  it.each([0, 9.7, 10])('respeta la escala desde %s puntos', (score) => {
    const area = { ...areas[0], score };
    render(
      <MentorshipProjection area={area} areas={[area, ...areas.slice(1)]} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
    expect(
      screen.getByRole('meter', { name: 'Puntaje proyectado' }),
    ).toHaveAttribute('aria-valuenow', String(Math.min(10, score + 1)));
  });
  it('no presenta una proyección mientras carga y distingue errores de un directorio vacío', () => {
    query.isPending = true;
    const view = render(<MentorshipProjection area={areas[0]} areas={areas} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Resumen de proyecci\u00f3n'),
    ).not.toBeInTheDocument();
    query.isPending = false;
    query.isError = true;
    view.rerender(<MentorshipProjection area={areas[0]} areas={areas} />);
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
    const view = render(<MentorshipProjection area={areas[0]} areas={areas} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
    query.data = { totalItems: 0 };
    view.rerender(<MentorshipProjection area={areas[3]} areas={areas} />);
    expect(directory).toHaveBeenLastCalledWith(
      expect.objectContaining({ area: 'QA' }),
    );
    expect(
      screen.getByLabelText('Resumen de proyecci\u00f3n').textContent,
    ).toContain('6 → 6 / 10');
  });
});

it('consulta solo al abrir y elimina la capa al cerrar la simulacion', () => {
  const onProjectionChange = vi.fn();
  render(
    <MentorshipProjection
      area={areas[0]}
      areas={areas}
      onProjectionChange={onProjectionChange}
    />,
  );
  expect(directory).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Simular habilidad' }));
  expect(onProjectionChange).toHaveBeenLastCalledWith({
    areaId: 'desarrollo',
    score: 5,
  });
  const meter = screen.getByRole('meter');
  expect(meter.firstElementChild).toHaveStyle({ width: '50%' });
  expect(meter.lastElementChild).toHaveStyle({ width: '40%' });
  fireEvent.click(
    screen.getByRole('button', { name: 'Cerrar simulaci\u00f3n' }),
  );
  expect(onProjectionChange).toHaveBeenLastCalledWith(null);
  expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});
