import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileCompleteness } from '../hooks/use-profile-completeness';
import { ProfileCompletenessProgress } from './profile-completeness-progress';

vi.mock('../hooks/use-profile-completeness', () => ({
  useProfileCompleteness: vi.fn(),
}));

const ready = {
  completeness: { percentage: 35, sections: [] },
  isLoading: false,
  error: null,
  reload: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => vi.mocked(useProfileCompleteness).mockReturnValue(ready));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfileCompletenessProgress', () => {
  it.each([
    [
      0,
      'Completa tu perfil profesional',
      'Continúa completando las secciones pendientes.',
    ],
    [
      35,
      'Tu perfil está tomando forma',
      'Continúa completando las secciones pendientes.',
    ],
    [
      100,
      'Perfil completado',
      'Has completado las secciones de tu perfil profesional.',
    ],
  ])(
    'shows the mockup panel for %s percent',
    (percentage, title, description) => {
      vi.mocked(useProfileCompleteness).mockReturnValue({
        ...ready,
        completeness: { percentage: Number(percentage), sections: [] },
      });
      render(<ProfileCompletenessProgress />);
      expect(
        screen.getByRole('heading', { level: 2, name: String(title) }),
      ).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      const bar = screen.getByRole('progressbar', {
        name: 'Completitud del perfil',
      });
      expect(bar.closest('[data-slot=card]')).toHaveClass(
        'bg-surface',
        'border',
        'border-border',
        'rounded-lg',
        'shadow-none',
      );
      expect(bar.querySelector('[data-slot=progress-value]')).toHaveClass(
        'text-3xl',
        'text-app-header',
      );
    },
  );

  it.each([0, 40, 41, 75, 76, 100])(
    'shows %s percent with a blue indicator and gray track',
    (percentage) => {
      vi.mocked(useProfileCompleteness).mockReturnValue({
        ...ready,
        completeness: { percentage: Number(percentage), sections: [] },
      });
      render(<ProfileCompletenessProgress />);
      const bar = screen.getByRole('progressbar', {
        name: 'Completitud del perfil',
      });
      expect(bar).toHaveAttribute('aria-valuenow', String(percentage));
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(bar).toHaveClass(
        '[&_[data-slot=progress-indicator]]:bg-app-header',
      );
      expect(bar).toHaveClass('[&_[data-slot=progress-track]]:bg-border');
      expect(
        bar.querySelector('[data-slot=progress-track]'),
      ).toBeInTheDocument();
      expect(screen.getByText(`${percentage}%`)).toBeVisible();
    },
  );

  it('updates the exact server value without remounting the indicator', () => {
    const { rerender } = render(<ProfileCompletenessProgress />);
    const bar = screen.getByRole('progressbar');
    vi.mocked(useProfileCompleteness).mockReturnValue({
      ...ready,
      completeness: { percentage: 55, sections: [] },
    });
    rerender(<ProfileCompletenessProgress />);
    expect(screen.getByRole('progressbar')).toBe(bar);
    expect(bar).toHaveAttribute('aria-valuenow', '55');
    expect(screen.getByText('55%')).toBeVisible();
    expect(bar).toHaveClass(
      '[&_[data-slot=progress-indicator]]:motion-reduce:transition-none',
    );
  });

  it('shows loading without displaying a false zero', () => {
    vi.mocked(useProfileCompleteness).mockReturnValue({
      ...ready,
      completeness: null,
      isLoading: true,
    });
    render(<ProfileCompletenessProgress />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando el progreso de tu perfil...',
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('shows the error and allows retrying with the keyboard', async () => {
    vi.mocked(useProfileCompleteness).mockReturnValue({
      ...ready,
      completeness: null,
      error: 'No se pudo cargar el progreso de tu perfil. Intenta de nuevo.',
    });
    render(<ProfileCompletenessProgress />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar el progreso',
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(ready.reload).toHaveBeenCalledOnce();
  });

  it('handles missing data without crashing or inventing a percentage', () => {
    vi.mocked(useProfileCompleteness).mockReturnValue({
      ...ready,
      completeness: null,
    });
    const { container } = render(<ProfileCompletenessProgress />);
    expect(container).toBeEmptyDOMElement();
  });
});
