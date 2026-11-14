import type { ReactNode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import type { ProfileGuideSession } from '../types/profile-guide-session.types';
import type { ProfileResponse } from '../types/profile-response.types';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { ProfileGuideProvider } from './profile-guide-provider';

const state = vi.hoisted(() => ({
  auth: {
    currentUserId: 'user-a' as string | null,
    roles: ['titulado'] as string[],
    isLoading: false,
  },
  pathname: '/dashboard',
  profile: null as ProfileResponse | null,
  completeness: null as ProfileCompletenessResponse | null,
  error: null as string | null,
  reload: vi.fn(),
  push: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  sessions: new Map<string, ProfileGuideSession>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push }),
}));
vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => state.auth,
}));
vi.mock('../hooks/use-profile', () => ({
  useProfile: () => ({ profile: state.profile }),
}));
vi.mock('../hooks/use-profile-completeness', () => ({
  useProfileCompleteness: () => ({
    completeness: state.completeness,
    error: state.error,
    reload: state.reload,
  }),
}));
vi.mock('../services/profile-guide-storage', () => ({
  createProfileGuideSession: () => ({
    version: 1,
    dismissed: false,
    completed: false,
    lastStep: null,
    skipped: [],
  }),
  profileGuideStorage: { read: state.read, write: state.write },
}));
vi.mock('./profile-guide-welcome-hero', () => ({
  ProfileGuideWelcomeHero: () => <span aria-hidden="true" />,
}));
vi.mock('./profile-guide-mascot', () => ({
  ProfileGuideMascot: () => <span aria-hidden="true" />,
}));
vi.mock('./profile-guide-celebration', () => ({
  ProfileGuideCelebration: () => <span aria-hidden="true" />,
}));
vi.mock('./profile-guide-bubble', () => ({
  ProfileGuideBubble: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: ReactNode;
  }) => (isOpen ? <div>{children}</div> : null),
}));
vi.mock('./profile-completeness-progress', () => ({
  ProfileCompletenessProgress: () => (
    <div
      role="progressbar"
      aria-label="Completitud del perfil"
      aria-valuenow={state.completeness?.percentage}
    />
  ),
}));
vi.mock('./profile-guide-step-content', () => ({
  ProfileGuideStepContent: ({
    step,
    onDirtyChange,
    onBusyChange,
    onSaved,
  }: ProfileGuideStepProps & { step: ProfileCompletenessSectionId }) => (
    <section aria-label={`Editor de ${step}`}>
      <button type="button" onClick={() => onDirtyChange(true)}>
        Editar datos de prueba
      </button>
      <button type="button" onClick={() => onBusyChange(true)}>
        Iniciar guardado de prueba
      </button>
      <button
        type="button"
        onClick={() => {
          onBusyChange(false);
          onSaved();
        }}
      >
        Confirmar guardado de prueba
      </button>
    </section>
  ),
}));

const PROFILE: ProfileResponse = {
  id: 'user-a',
  firstName: 'Romario',
  lastName: 'Via',
  institutionalEmail: 'romario@umss.edu',
  personalEmail: null,
  phone: null,
  city: null,
  headline: null,
  aboutMe: null,
  updatedAt: '2026-11-14T12:00:00.000Z',
};

function completeness(
  completed: ProfileCompletenessSectionId[] = [],
  percentage = 35,
): ProfileCompletenessResponse {
  return {
    percentage,
    sections: PROFILE_COMPLETENESS_SECTION_IDS.map((id) => ({
      id,
      weight: 1,
      isCompleted: completed.includes(id),
    })),
  };
}

function session(
  changes: Partial<ProfileGuideSession> = {},
): ProfileGuideSession {
  return {
    version: 1,
    dismissed: false,
    completed: false,
    lastStep: null,
    skipped: [],
    ...changes,
  };
}

function page() {
  return (
    <ProfileGuideProvider>
      <main>Contenido del dashboard</main>
    </ProfileGuideProvider>
  );
}

async function startGuide(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: 'Empezar ahora' }),
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.auth = {
    currentUserId: 'user-a',
    roles: ['titulado'],
    isLoading: false,
  };
  state.pathname = '/dashboard';
  state.profile = { ...PROFILE };
  state.completeness = completeness(['contact']);
  state.error = null;
  state.sessions.clear();
  state.reload.mockResolvedValue(undefined);
  state.read.mockImplementation(
    async (userId: string) => state.sessions.get(userId) ?? session(),
  );
  state.write.mockImplementation(
    async (userId: string, value: ProfileGuideSession) => {
      state.sessions.set(userId, { ...value, skipped: [...value.skipped] });
    },
  );
});

afterEach(cleanup);

describe('ProfileGuideProvider', () => {
  it('waits for the profile, completeness and asynchronous browser session before welcoming', async () => {
    const stored = deferred<ProfileGuideSession>();
    state.read.mockReturnValueOnce(stored.promise);
    state.profile = null;
    state.completeness = null;
    const view = render(page());

    await waitFor(() => expect(state.read).toHaveBeenCalledWith('user-a'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => stored.resolve(session()));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    state.profile = PROFILE;
    view.rerender(page());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    state.completeness = completeness(['contact']);
    view.rerender(page());

    expect(
      await screen.findByRole('dialog', { name: '¡Hola, Romario!' }),
    ).toBeVisible();
  });

  it.each([
    {
      name: 'loading session',
      userId: 'user-a',
      roles: ['titulado'],
      loading: true,
    },
    { name: 'signed out', userId: null, roles: [], loading: false },
    {
      name: 'another role',
      userId: 'company-a',
      roles: ['empresa'],
      loading: false,
    },
  ])(
    'does not initialize the guide for a $name',
    ({ userId, roles, loading }) => {
      state.auth = { currentUserId: userId, roles, isLoading: loading };
      render(page());

      expect(screen.getByText('Contenido del dashboard')).toBeVisible();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(state.read).not.toHaveBeenCalled();
    },
  );

  it('automatically welcomes only on the dashboard', async () => {
    state.pathname = '/profile/settings';
    const view = render(page());
    await screen.findByRole('button', { name: 'Abrir asistente de perfil' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    state.pathname = '/dashboard';
    view.rerender(page());

    expect(
      await screen.findByRole('button', { name: 'Empezar ahora' }),
    ).toBeVisible();
  });

  it('starts the first pending section in the overlay without routing', async () => {
    const user = userEvent.setup();
    render(page());

    await startGuide(user);

    expect(
      await screen.findByRole('dialog', { name: 'Presentación' }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Editor de presentation' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(state.push).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(state.write).toHaveBeenLastCalledWith(
        'user-a',
        expect.objectContaining({ lastStep: 'presentation', dismissed: true }),
      ),
    );
  });

  it('enables Next after saving only when refreshed completeness confirms the section', async () => {
    const user = userEvent.setup();
    const view = render(page());
    await startGuide(user);

    await user.click(
      screen.getByRole('button', { name: 'Editar datos de prueba' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Confirmar guardado de prueba' }),
    );
    expect(state.reload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    state.completeness = completeness(['contact', 'presentation'], 50);
    view.rerender(page());
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
    expect(
      screen.getByRole('progressbar', { name: 'Completitud del perfil' }),
    ).toHaveAttribute('aria-valuenow', '50');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(
      await screen.findByRole('dialog', { name: 'Formación académica' }),
    ).toBeVisible();
    expect(state.push).not.toHaveBeenCalled();
  });

  it('blocks navigation during a pending save and advances after the final saved result', async () => {
    const user = userEvent.setup();
    const view = render(page());
    await startGuide(user);
    await user.click(
      screen.getByRole('button', { name: 'Iniciar guardado de prueba' }),
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Continuar más tarde' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pausar guía' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'Confirmar guardado de prueba' }),
    );
    state.completeness = completeness(
      [...PROFILE_COMPLETENESS_SECTION_IDS],
      100,
    );
    view.rerender(page());
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));

    const finishDialog = await screen.findByRole('dialog', {
      name: '¡Tu perfil está completo!',
    });
    expect(finishDialog).toBeVisible();
    expect(
      within(finishDialog).getByRole('progressbar', {
        name: 'Completitud del perfil',
      }),
    ).toHaveAttribute('aria-valuenow', '100');
    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    await waitFor(() =>
      expect(state.write).toHaveBeenLastCalledWith(
        'user-a',
        expect.objectContaining({
          completed: true,
          dismissed: true,
          lastStep: null,
          skipped: [],
        }),
      ),
    );
    expect(state.push).toHaveBeenCalledWith('/dashboard');
  });

  it.each(['Anterior', 'Continuar más tarde'])(
    'confirms unsaved changes before %s',
    async (action) => {
      const user = userEvent.setup();
      render(page());
      await startGuide(user);
      await user.click(
        screen.getByRole('button', { name: 'Editar datos de prueba' }),
      );
      await user.click(screen.getByRole('button', { name: action }));

      const confirmation = await screen.findByRole('alertdialog', {
        name: '¿Descartar los cambios sin guardar?',
      });
      await user.click(
        within(confirmation).getByRole('button', { name: 'Seguir editando' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole('dialog', { name: 'Presentación' }),
      ).toBeVisible();
      expect(state.write).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: action }));
      await user.click(
        await screen.findByRole('button', { name: 'Descartar cambios' }),
      );

      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      if (action === 'Anterior') {
        expect(
          screen.getByRole('dialog', { name: 'Datos de contacto' }),
        ).toBeVisible();
      } else {
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(
          screen.getByRole('button', { name: 'Abrir asistente de perfil' }),
        ).toBeVisible();
      }
      expect(state.push).not.toHaveBeenCalled();
    },
  );

  it('skips a section without changing its real completeness or refreshing it as saved', async () => {
    const user = userEvent.setup();
    render(page());
    await startGuide(user);
    await user.click(screen.getByRole('button', { name: 'Omitir por ahora' }));

    expect(
      await screen.findByRole('dialog', { name: 'Formación académica' }),
    ).toBeVisible();
    expect(
      screen.getByRole('progressbar', { name: 'Completitud del perfil' }),
    ).toHaveAttribute('aria-valuenow', '35');
    expect(
      state.completeness?.sections.find(({ id }) => id === 'presentation')
        ?.isCompleted,
    ).toBe(false);
    expect(state.reload).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(state.write).toHaveBeenLastCalledWith(
        'user-a',
        expect.objectContaining({
          lastStep: 'education',
          skipped: ['presentation'],
        }),
      ),
    );
  });

  it('remembers dismissal without welcoming again after the provider remounts', async () => {
    const user = userEvent.setup();
    const view = render(page());
    await user.click(await screen.findByRole('button', { name: 'Más tarde' }));
    await waitFor(() =>
      expect(state.sessions.get('user-a')?.dismissed).toBe(true),
    );
    view.unmount();
    render(page());

    expect(
      await screen.findByRole('button', { name: 'Abrir asistente de perfil' }),
    ).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores and persists each account independently when the active account changes', async () => {
    const user = userEvent.setup();
    state.sessions.set(
      'user-a',
      session({ dismissed: true, lastStep: 'skills' }),
    );
    state.sessions.set(
      'user-b',
      session({ dismissed: true, lastStep: 'education' }),
    );
    const view = render(page());
    await user.click(
      await screen.findByRole('button', { name: 'Abrir asistente de perfil' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Continuar mi perfil' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Habilidades' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Continuar más tarde' }),
    );

    state.auth = { ...state.auth, currentUserId: 'user-b' };
    state.profile = { ...PROFILE, id: 'user-b', firstName: 'Ana' };
    view.rerender(page());
    await user.click(
      await screen.findByRole('button', { name: 'Abrir asistente de perfil' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Continuar mi perfil' }),
    );

    expect(
      await screen.findByRole('dialog', { name: 'Formación académica' }),
    ).toBeVisible();
    expect(state.read).toHaveBeenCalledWith('user-b');
    await waitFor(() =>
      expect(state.write).toHaveBeenLastCalledWith(
        'user-b',
        expect.objectContaining({ lastStep: 'education' }),
      ),
    );
    expect(state.sessions.get('user-a')?.lastStep).toBe('skills');
  });

  it('does not automatically welcome an already completed profile', async () => {
    state.completeness = completeness(
      [...PROFILE_COMPLETENESS_SECTION_IDS],
      100,
    );
    render(page());

    expect(
      await screen.findByRole('button', { name: 'Abrir asistente de perfil' }),
    ).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state.push).not.toHaveBeenCalled();
  });

  it('waits for the matching profile when the previous account is still cached', async () => {
    state.sessions.set('user-a', session({ dismissed: true }));
    const view = render(page());
    await screen.findByRole('button', { name: 'Abrir asistente de perfil' });

    state.auth = { ...state.auth, currentUserId: 'user-b' };
    view.rerender(page());
    await waitFor(() => expect(state.read).toHaveBeenCalledWith('user-b'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Abrir asistente de perfil' }),
    ).not.toBeInTheDocument();
    state.profile = { ...PROFILE, id: 'user-b', firstName: 'Ana' };
    view.rerender(page());

    expect(
      await screen.findByRole('dialog', { name: '¡Hola, Ana!' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('dialog', { name: '¡Hola, Romario!' }),
    ).not.toBeInTheDocument();
  });

  it('keeps Next disabled if completeness becomes unavailable after the save', async () => {
    const user = userEvent.setup();
    const view = render(page());
    await startGuide(user);
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar guardado de prueba' }),
    );
    state.completeness = completeness(['contact', 'presentation'], 50);
    state.error = 'No se pudo actualizar el progreso.';
    view.rerender(page());

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
