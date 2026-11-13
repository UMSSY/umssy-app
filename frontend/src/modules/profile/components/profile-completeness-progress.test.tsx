import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { useProfileCompleteness } from '../hooks/use-profile-completeness';
import { createProfileCompleteness } from '../testing/profile-completeness.fixture';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import { ProfileCompletenessProgress } from './profile-completeness-progress';

vi.mock('../hooks/use-profile-completeness', () => ({
  useProfileCompleteness: vi.fn(),
}));

const ready = {
  completeness: createProfileCompleteness(['contact', 'presentation']),
  isLoading: false,
  error: null,
  reload: vi.fn().mockResolvedValue(undefined),
};
const checklistName = { name: 'Secciones del perfil' };
const triggerName = { name: 'Ver secciones del perfil' };

function setCompletedSections(ids: readonly ProfileCompletenessSectionId[]) {
  vi.mocked(useProfileCompleteness).mockReturnValue({
    ...ready,
    completeness: createProfileCompleteness(ids),
  });
}

beforeEach(() => vi.mocked(useProfileCompleteness).mockReturnValue(ready));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('incomplete profile checklist', () => {
  it.each([
    { percentage: 0, completed: [] },
    { percentage: 30, completed: ['contact', 'presentation'] },
    {
      percentage: 75,
      completed: [
        'contact',
        'presentation',
        'education',
        'work-experience',
        'skills',
      ],
    },
  ] satisfies {
    percentage: number;
    completed: ProfileCompletenessSectionId[];
  }[])(
    'stays expanded at $percentage percent despite clicks and Escape',
    async ({ percentage, completed }) => {
      setCompletedSections(completed);
      const user = userEvent.setup();
      render(
        <>
          <p>Outside the indicator</p>
          <ProfileCompletenessProgress />
        </>,
      );
      const bar = screen.getByRole('progressbar', {
        name: 'Completitud del perfil',
      });
      expect(bar).toHaveAttribute('aria-valuenow', String(percentage));
      expect(screen.getByRole('region', checklistName)).toBeVisible();
      expect(screen.queryByRole('button', triggerName)).not.toBeInTheDocument();

      await user.click(bar);
      await user.click(screen.getByText('Outside the indicator'));
      await user.keyboard('{Escape}');
      expect(screen.getByRole('region', checklistName)).toBeVisible();
      expect(screen.getAllByRole('listitem')).toHaveLength(7);
    },
  );

  it('updates the percentage, count and saved section status without remounting', () => {
    const { rerender } = render(<ProfileCompletenessProgress />);
    const bar = screen.getByRole('progressbar');
    expect(screen.getByText('2 de 7 secciones completadas')).toBeVisible();
    expect(
      screen.getByRole('listitem', { name: 'Formación académica: Pendiente' }),
    ).toBeVisible();

    setCompletedSections(['contact', 'presentation', 'education']);
    rerender(<ProfileCompletenessProgress />);
    expect(screen.getByRole('progressbar')).toBe(bar);
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByText('3 de 7 secciones completadas')).toBeVisible();
    expect(
      screen.getByRole('listitem', { name: 'Formación académica: Completada' }),
    ).toBeVisible();

    vi.mocked(useProfileCompleteness).mockReturnValue(ready);
    rerender(<ProfileCompletenessProgress />);
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(screen.getByText('2 de 7 secciones completadas')).toBeVisible();
    expect(
      screen.getByRole('listitem', { name: 'Formación académica: Pendiente' }),
    ).toBeVisible();
  });
});

describe('completed profile checklist', () => {
  beforeEach(() => setCompletedSections(PROFILE_COMPLETENESS_SECTION_IDS));

  it('starts collapsed and toggles only the checklist when clicking the indicator', async () => {
    const user = userEvent.setup();
    render(<ProfileCompletenessProgress />);
    const trigger = screen.getByRole('button', triggerName);
    const bar = screen.getByRole('progressbar');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByRole('region', checklistName)).not.toBeInTheDocument();

    await user.click(trigger);
    const panel = screen.getByRole('region', checklistName);
    expect(panel).toBeVisible();
    expect(
      document.getElementById(trigger.getAttribute('aria-controls')!),
    ).toContainElement(panel);
    expect(screen.getByText('7 de 7 secciones completadas')).toBeVisible();
    await user.click(
      screen.getByRole('listitem', { name: 'Presentación: Completada' }),
    );
    expect(panel).toBeVisible();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', checklistName)).not.toBeInTheDocument();
    expect(bar).toBeVisible();
  });

  it.each(['{Enter}', ' '])(
    'opens with %s and returns focus after Escape',
    async (key) => {
      const user = userEvent.setup();
      render(<ProfileCompletenessProgress />);
      const trigger = screen.getByRole('button', triggerName);
      await user.tab();
      expect(trigger).toHaveFocus();
      await user.keyboard(key);
      expect(screen.getByRole('region', checklistName)).toBeVisible();
      await user.keyboard('{Escape}');
      expect(
        screen.queryByRole('region', checklistName),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    },
  );

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p>Outside the indicator</p>
        <ProfileCompletenessProgress />
      </>,
    );
    await user.click(screen.getByRole('button', triggerName));
    await user.click(screen.getByText('Outside the indicator'));
    expect(screen.queryByRole('region', checklistName)).not.toBeInTheDocument();
  });

  it('collapses on reaching 100 percent and stays open again if data becomes incomplete', async () => {
    vi.mocked(useProfileCompleteness).mockReturnValue(ready);
    const user = userEvent.setup();
    const { rerender } = render(<ProfileCompletenessProgress />);
    expect(screen.getByRole('region', checklistName)).toBeVisible();

    setCompletedSections(PROFILE_COMPLETENESS_SECTION_IDS);
    rerender(<ProfileCompletenessProgress />);
    expect(screen.queryByRole('region', checklistName)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', triggerName));
    expect(screen.getByRole('region', checklistName)).toBeVisible();

    vi.mocked(useProfileCompleteness).mockReturnValue(ready);
    rerender(<ProfileCompletenessProgress />);
    await user.keyboard('{Escape}');
    await user.click(document.body);
    expect(screen.getByRole('region', checklistName)).toBeVisible();
    expect(screen.queryByRole('button', triggerName)).not.toBeInTheDocument();
  });
});

describe('progress content and request states', () => {
  it.each([{ ids: [] }, { ids: PROFILE_COMPLETENESS_SECTION_IDS }])(
    'shows the editor percentage without checklist navigation: %j',
    ({ ids }) => {
      setCompletedSections(ids);
      render(<ProfileCompletenessProgress showChecklist={false} />);
      expect(
        screen.getByRole('progressbar', { name: 'Completitud del perfil' }),
      ).toHaveAttribute('aria-valuenow', ids.length ? '100' : '0');
      expect(
        screen.queryByRole('region', checklistName),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', triggerName)).not.toBeInTheDocument();
      expect(useProfileCompleteness).toHaveBeenCalledWith(false);
    },
  );

  it.each([
    { completed: [], percentage: 0, title: 'Completa tu perfil profesional' },
    {
      completed: ['contact', 'presentation'],
      percentage: 30,
      title: 'Tu perfil está tomando forma',
    },
    {
      completed: PROFILE_COMPLETENESS_SECTION_IDS,
      percentage: 100,
      title: 'Perfil completado',
    },
  ] satisfies {
    completed: readonly ProfileCompletenessSectionId[];
    percentage: number;
    title: string;
  }[])(
    'shows the saved percentage and heading at $percentage percent',
    ({ completed, percentage, title }) => {
      setCompletedSections(completed);
      render(<ProfileCompletenessProgress />);
      expect(
        screen.getByRole('heading', { level: 2, name: title }),
      ).toBeVisible();
      const bar = screen.getByRole('progressbar', {
        name: 'Completitud del perfil',
      });
      expect(bar).toHaveAttribute('aria-valuenow', String(percentage));
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(screen.getByText(`${percentage}%`)).toBeVisible();
    },
  );

  it('shows loading without inventing a zero percentage or section statuses', () => {
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
    expect(screen.queryByRole('region', checklistName)).not.toBeInTheDocument();
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

  it('handles missing data without inventing a percentage', () => {
    vi.mocked(useProfileCompleteness).mockReturnValue({
      ...ready,
      completeness: null,
    });
    const { container } = render(<ProfileCompletenessProgress />);
    expect(container).toBeEmptyDOMElement();
  });
});
