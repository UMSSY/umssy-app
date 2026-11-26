import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RADAR_AREA_SCORES } from '../data/radar-profile.data';
import { AffinityRadarDot } from './affinity-radar-dot';

const area = RADAR_AREA_SCORES[0];
afterEach(cleanup);

it('provides a centered 48 by 48 target without enlarging the visible dot', () => {
  const onAreaClick = vi.fn();
  render(
    <svg>
      <AffinityRadarDot
        area={area}
        cx={100}
        cy={120}
        onAreaClick={onAreaClick}
      />
    </svg>,
  );
  const hit = screen.getByTestId(`radar-hit-${area.id}`);
  expect(hit).toHaveAttribute('x', '76');
  expect(hit).toHaveAttribute('y', '96');
  expect(hit).toHaveAttribute('width', '48');
  expect(hit).toHaveAttribute('height', '48');
  expect(hit).toHaveAttribute('fill', 'transparent');
  expect(hit).toHaveAttribute('pointer-events', 'all');
  expect(
    screen.getByTestId(`radar-dot-${area.id}`).querySelector('circle'),
  ).toHaveAttribute('r', '4.5');
  fireEvent.click(hit);
  expect(onAreaClick).toHaveBeenCalledExactlyOnceWith(area.id);
});
it('keeps keyboard activation on the focusable group', () => {
  const onAreaClick = vi.fn();
  render(
    <svg>
      <AffinityRadarDot
        area={area}
        cx={100}
        cy={100}
        onAreaClick={onAreaClick}
      />
    </svg>,
  );
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('tabindex', '0');
  fireEvent.keyDown(button, { key: 'Tab' });
  expect(onAreaClick).not.toHaveBeenCalled();
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.keyDown(button, { key: ' ' });
  expect(onAreaClick).toHaveBeenCalledTimes(2);
  expect(onAreaClick).toHaveBeenLastCalledWith(area.id);
});
it('does not create an invisible pointer target for a non-interactive series', () => {
  render(
    <svg>
      <AffinityRadarDot area={area} cx={100} cy={100} />
    </svg>,
  );
  expect(screen.queryByTestId(`radar-hit-${area.id}`)).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(
    screen.getByTestId(`radar-dot-${area.id}`).querySelector('circle'),
  ).toHaveAttribute('pointer-events', 'none');
});
it.each([
  { cx: undefined, cy: 10 },
  { cx: 10, cy: undefined },
])(
  'does not place targets at the SVG origin when a coordinate is missing: %o',
  (coords) => {
    render(
      <svg>
        <AffinityRadarDot area={area} {...coords} onAreaClick={vi.fn()} />
      </svg>,
    );
    expect(screen.queryByTestId(`radar-dot-${area.id}`)).toBeNull();
  },
);
it('accepts zero coordinates and preserves the area identity of coincident points for keyboard use', () => {
  const onAreaClick = vi.fn();
  render(
    <svg>
      {RADAR_AREA_SCORES.map((a) => (
        <AffinityRadarDot
          key={a.id}
          area={{ ...a, score: 0 }}
          cx={0}
          cy={0}
          onAreaClick={onAreaClick}
        />
      ))}
    </svg>,
  );
  for (const a of RADAR_AREA_SCORES) {
    const group = screen.getByTestId(`radar-dot-${a.id}`);
    fireEvent.keyDown(group, { key: 'Enter' });
    expect(onAreaClick).toHaveBeenLastCalledWith(a.id);
    expect(group.querySelector('rect')).toHaveAttribute('x', '-24');
  }
});
