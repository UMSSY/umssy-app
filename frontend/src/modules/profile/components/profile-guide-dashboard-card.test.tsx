import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileGuideContext } from '../contexts/profile-guide-context';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { useProfileCompleteness } from '../hooks/use-profile-completeness';
import { createProfileCompleteness } from '../testing/profile-completeness.fixture';
import { ProfileGuideDashboardCard } from './profile-guide-dashboard-card';

vi.mock('../hooks/use-profile-completeness', () => ({
  useProfileCompleteness: vi.fn(),
}));
vi.mock('./profile-guide-mascot', () => ({
  ProfileGuideMascot: () => <span role="img" aria-label="Personaje UMSSY" />,
}));

beforeEach(() => {
  vi.mocked(useProfileCompleteness).mockReturnValue({
    completeness: createProfileCompleteness(['contact', 'presentation']),
    isLoading: false,
    error: null,
    reload: vi.fn().mockResolvedValue(undefined),
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfileGuideDashboardCard', () => {
  it('keeps real progress and checklist beside the robot with a single continue action', async () => {
    const start = vi.fn();
    render(
      <ProfileGuideContext.Provider
        value={{ isEnabled: true, isComplete: false, start }}
      >
        <ProfileGuideDashboardCard />
      </ProfileGuideContext.Provider>,
    );
    const card = screen.getByRole('region', {
      name: 'Tu perfil con el asistente UMSSY',
    });
    expect(within(card).getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '30',
    );
    expect(within(card).getAllByRole('listitem')).toHaveLength(7);
    expect(
      within(card).getByText('2 de 7 secciones completadas'),
    ).toBeVisible();
    expect(
      within(card).getByRole('img', { name: 'Personaje UMSSY' }),
    ).toBeVisible();
    expect(
      within(card).getAllByRole('button', { name: 'Continuar mi perfil' }),
    ).toHaveLength(1);
    const user = userEvent.setup();
    await user.click(
      within(card).getByRole('button', { name: 'Continuar mi perfil' }),
    );
    await user.click(
      within(card).getByRole('button', {
        name: 'Abrir guía con el asistente UMSSY',
      }),
    );
    expect(start.mock.calls).toEqual([[], []]);
  });

  it('preserves the ordinary indicator when the shared guide is unavailable', () => {
    render(<ProfileGuideDashboardCard />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '30',
    );
    expect(
      screen.getByRole('region', { name: 'Secciones del perfil' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('img', { name: 'Personaje UMSSY' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continuar mi perfil' }),
    ).not.toBeInTheDocument();
  });

  it('removes the incomplete guidance card when the shared guide reports completion', () => {
    const { container } = render(
      <ProfileGuideContext.Provider
        value={{ isEnabled: true, isComplete: true, start: vi.fn() }}
      >
        <ProfileGuideDashboardCard />
      </ProfileGuideContext.Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('retains the real 100 percent card until the user explicitly finishes the guide', async () => {
    const start = vi.fn();
    vi.mocked(useProfileCompleteness).mockReturnValue({
      completeness: createProfileCompleteness(PROFILE_COMPLETENESS_SECTION_IDS),
      isLoading: false,
      error: null,
      reload: vi.fn().mockResolvedValue(undefined),
    });
    const { rerender, container } = render(
      <ProfileGuideContext.Provider
        value={{ isEnabled: true, isComplete: true, hasFinished: false, start }}
      >
        <ProfileGuideDashboardCard />
      </ProfileGuideContext.Provider>,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('img', { name: 'Personaje UMSSY' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Continuar mi perfil' }),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Finalizar mi perfil' }));
    expect(start).toHaveBeenCalledExactlyOnceWith();
    rerender(
      <ProfileGuideContext.Provider
        value={{ isEnabled: true, isComplete: true, hasFinished: true, start }}
      >
        <ProfileGuideDashboardCard />
      </ProfileGuideContext.Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
