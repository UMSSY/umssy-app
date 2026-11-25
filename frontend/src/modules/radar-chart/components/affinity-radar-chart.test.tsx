import { cloneElement, type ReactElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GLOBAL_AVERAGE } from '../data/area-details.data';
import { RADAR_AREA_SCORES } from '../data/radar-profile.data';
import { AffinityRadarChart } from './affinity-radar-chart';

vi.mock('recharts', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('recharts')>();

  return {
    ...originalModule,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width: number; height: number }>;
    }) => cloneElement(children, { width: 600, height: 440 }),
  };
});

describe('AffinityRadarChart', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the six axes with a point each', () => {
    render(
      <AffinityRadarChart areas={RADAR_AREA_SCORES} average={GLOBAL_AVERAGE} />,
    );

    RADAR_AREA_SCORES.forEach((area) => {
      expect(screen.getByText(area.name)).toBeDefined();
      expect(screen.getByTestId(`radar-dot-${area.id}`)).toBeDefined();
    });
    expect(
      document.querySelectorAll('.recharts-polar-angle-axis-tick'),
    ).toHaveLength(6);
  });

  it('draws the shaded polygon and the levels from 0 to 10', () => {
    render(<AffinityRadarChart areas={RADAR_AREA_SCORES} />);

    const levels = Array.from(
      document.querySelectorAll('.recharts-polar-radius-axis-tick-value'),
      (tick) => tick.textContent,
    );

    expect(document.querySelector('.recharts-radar-polygon')).not.toBeNull();
    expect(levels).toEqual(['0', '2', '4', '6', '8', '10']);
  });

  it('shows the title, the legend and the average in Spanish', () => {
    render(
      <AffinityRadarChart areas={RADAR_AREA_SCORES} average={GLOBAL_AVERAGE} />,
    );

    expect(
      screen.getByRole('heading', { name: 'Desglose vectorial de afinidad' }),
    ).toBeDefined();
    expect(
      screen.getByText('6 áreas de competencias verificadas'),
    ).toBeDefined();
    expect(screen.getByText('Puntaje de afinidad del perfil')).toBeDefined();
    expect(screen.getByText('6,25')).toBeDefined();
    expect(screen.getByText('Promedio')).toBeDefined();
  });

  it('hides the average when it is not provided', () => {
    render(<AffinityRadarChart areas={RADAR_AREA_SCORES} />);

    expect(screen.queryByText('Promedio')).toBeNull();
  });

  it('calls onAreaClick with the area id when an axis name is clicked', () => {
    const onAreaClick = vi.fn();
    render(
      <AffinityRadarChart
        areas={RADAR_AREA_SCORES}
        onAreaClick={onAreaClick}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver detalle de Cloud/DevOps' }),
    );

    expect(onAreaClick).toHaveBeenCalledTimes(1);
    expect(onAreaClick).toHaveBeenCalledWith('cloud-devops');
  });

  it('calls onAreaClick with the area id when an axis point is clicked', () => {
    const onAreaClick = vi.fn();
    render(
      <AffinityRadarChart
        areas={RADAR_AREA_SCORES}
        onAreaClick={onAreaClick}
      />,
    );

    fireEvent.click(screen.getByTestId('radar-dot-ciberseguridad'));

    expect(onAreaClick).toHaveBeenCalledTimes(1);
    expect(onAreaClick).toHaveBeenCalledWith('ciberseguridad');
  });

  it('selects an axis with the keyboard', () => {
    const onAreaClick = vi.fn();
    render(
      <AffinityRadarChart
        areas={RADAR_AREA_SCORES}
        onAreaClick={onAreaClick}
      />,
    );

    const axis = screen.getByRole('button', { name: 'Ver detalle de QA' });
    fireEvent.keyDown(axis, { key: 'Tab' });
    expect(onAreaClick).not.toHaveBeenCalled();

    fireEvent.keyDown(axis, { key: 'Enter' });
    fireEvent.keyDown(axis, { key: ' ' });

    expect(onAreaClick).toHaveBeenCalledTimes(2);
    expect(onAreaClick).toHaveBeenLastCalledWith('qa');
  });

  it('does not make the axes interactive without onAreaClick', () => {
    render(<AffinityRadarChart areas={RADAR_AREA_SCORES} />);

    expect(screen.queryByRole('button')).toBeNull();
    fireEvent.click(screen.getByTestId('radar-dot-qa'));
  });

  it('shows an empty state when there is no data', () => {
    render(<AffinityRadarChart areas={[]} average={0} />);

    expect(screen.getByText('Aún no hay datos de afinidad')).toBeDefined();
    expect(screen.queryByText('Promedio')).toBeNull();
    expect(document.querySelector('.recharts-wrapper')).toBeNull();
  });
});

it('superpone la proyeccion verde sin cambiar el poligono actual', () => {
  const before = structuredClone(RADAR_AREA_SCORES);
  const view = render(<AffinityRadarChart areas={RADAR_AREA_SCORES} />);
  const current = document
    .querySelector('.recharts-radar-polygon path')
    ?.getAttribute('d');
  view.rerender(
    <AffinityRadarChart
      areas={RADAR_AREA_SCORES}
      projectedScores={{ qa: 10 }}
    />,
  );
  const polygons = document.querySelectorAll('.recharts-radar-polygon path');
  expect(polygons).toHaveLength(2);
  expect(polygons[0].getAttribute('d')).toBe(current);
  expect(polygons[1]).toHaveAttribute('stroke', 'var(--color-success)');
  expect(polygons[1]).toHaveAttribute('stroke-dasharray', '4 3');
  expect(RADAR_AREA_SCORES).toEqual(before);
  view.rerender(<AffinityRadarChart areas={RADAR_AREA_SCORES} />);
  expect(document.querySelectorAll('.recharts-radar')).toHaveLength(1);
});

describe('HU3 touch targets with comparison and projection', () => {
  afterEach(cleanup);
  it('adds one hit region per current area without making overlay points interactive', () => {
    const onAreaClick = vi.fn();
    render(
      <AffinityRadarChart
        areas={RADAR_AREA_SCORES}
        previousScores={{ qa: 2 }}
        comparisonEnabled
        projectedScores={{ qa: 10 }}
        onAreaClick={onAreaClick}
      />,
    );
    expect(document.querySelectorAll('.recharts-radar')).toHaveLength(3);
    expect(screen.getAllByTestId(/^radar-hit-/)).toHaveLength(
      RADAR_AREA_SCORES.length,
    );
    for (const area of RADAR_AREA_SCORES) {
      const hit = screen.getByTestId(`radar-hit-${area.id}`);
      expect(hit).toHaveAttribute('width', '48');
      expect(hit).toHaveAttribute('height', '48');
      fireEvent.click(hit);
      expect(onAreaClick).toHaveBeenLastCalledWith(area.id);
    }
  });
});
