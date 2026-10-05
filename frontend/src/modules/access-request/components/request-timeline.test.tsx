import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { TimelineStage } from '../types/request-status.types';
import { RequestTimeline } from './request-timeline';

const STAGES: TimelineStage[] = [
  {
    id: 'request-sent',
    label: 'Solicitud enviada',
    state: 'completed',
    occurredAt: '2026-10-03T14:35:00-04:00',
    occurredAtLabel: '03/10/2026, 14:35',
  },
  {
    id: 'document-received',
    label: 'Documento recibido',
    state: 'completed',
    occurredAt: '2026-10-03T14:35:00-04:00',
    occurredAtLabel: '03/10/2026, 14:35',
  },
  {
    id: 'career-review',
    label: 'Revisión de la carrera',
    state: 'current',
    occurredAt: null,
    occurredAtLabel: null,
  },
  {
    id: 'account-activation',
    label: 'Activación de cuenta',
    state: 'pending',
    occurredAt: null,
    occurredAtLabel: null,
  },
];

afterEach(() => {
  cleanup();
});

describe('RequestTimeline', () => {
  it('muestra las cuatro etapas', () => {
    render(<RequestTimeline stages={STAGES} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Solicitud enviada')).toBeTruthy();
    expect(screen.getByText('Activación de cuenta')).toBeTruthy();
  });

  it('muestra fecha y hora de las etapas que ya ocurrieron', () => {
    render(<RequestTimeline stages={STAGES} />);

    expect(screen.getAllByText('03/10/2026, 14:35')).toHaveLength(2);
  });

  it('marca la etapa actual y la muestra como en curso', () => {
    const { container } = render(<RequestTimeline stages={STAGES} />);
    const current = container.querySelector('[aria-current="step"]');

    expect(current?.textContent).toContain('Revisión de la carrera');
    expect(current?.textContent).toContain('En curso');
  });

  it('muestra las etapas futuras como pendientes', () => {
    render(<RequestTimeline stages={STAGES} />);

    expect(screen.getByText('Pendiente')).toBeTruthy();
  });
});
