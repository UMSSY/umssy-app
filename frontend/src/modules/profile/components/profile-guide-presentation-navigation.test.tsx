import { act, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { PROFILE_FEEDBACK_MESSAGES } from '../constants/profile-feedback.constants';
import { PROFILE_VALIDATION_MESSAGES } from '../constants/profile-validation.constants';
import { profileCompletenessService } from '../services/profile-completeness.service';
import {
  createProfileGuideSession,
  profileGuideStorage,
} from '../services/profile-guide-storage';
import { profileService } from '../services/profile.service';
import type { ProfileResponse } from '../types/profile-response.types';
import { PresentationSettings } from './presentation-settings';
import { ProfileGuideProvider } from './profile-guide-provider';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/profile/settings',
  useRouter: () => ({ push }),
}));
vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({
    currentUserId: 'graduate',
    roles: ['titulado'],
    isLoading: false,
  }),
}));

const profile: ProfileResponse = {
  id: 'graduate',
  firstName: 'Andrea',
  lastName: 'Pérez',
  institutionalEmail: 'andrea@example.test',
  personalEmail: null,
  phone: null,
  city: null,
  headline: 'Ingeniera',
  aboutMe: 'Desarrollo aplicaciones.',
  updatedAt: '2026-11-21T12:00:00Z',
};
const draft = 'Desarrollo aplicaciones educativas.';

beforeEach(() => {
  push.mockClear();
  vi.spyOn(profileService, 'getProfile').mockResolvedValue(profile);
  vi.spyOn(profileService, 'updatePresentation').mockResolvedValue({
    ...profile,
    aboutMe: draft,
  });
  vi.spyOn(profileCompletenessService, 'getCompleteness').mockResolvedValue({
    percentage: 100,
    sections: PROFILE_COMPLETENESS_SECTION_IDS.map((id) => ({
      id,
      weight: 1,
      isCompleted: true,
    })),
  });
  vi.spyOn(profileGuideStorage, 'read').mockResolvedValue({
    ...createProfileGuideSession(),
    completed: true,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function openPresentation() {
  const user = userEvent.setup();
  renderWithQuery(
    <ProfileGuideProvider>
      <PresentationSettings />
    </ProfileGuideProvider>,
  );
  const about = await screen.findByRole('textbox', { name: /Acerca de/ });
  async function reviewProfile() {
    await user.click(
      await screen.findByRole('button', { name: 'Abrir asistente de perfil' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Revisar mi perfil' }),
    );
  }
  async function editAbout() {
    await user.clear(about);
    await user.type(about, draft);
  }
  return { user, about, reviewProfile, editAbout };
}

describe('Reviewing the profile from the assistant while editing a presentation', () => {
  it('offers three choices and keeps the draft when the titulado continues editing', async () => {
    const { user, about, editAbout, reviewProfile } = await openPresentation();
    await editAbout();
    await reviewProfile();

    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Descartar cambios' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Continuar editando' }),
    );
    expect(about).toHaveValue(draft);
    await waitFor(() => expect(about).toHaveFocus());
    expect(push).not.toHaveBeenCalled();
    expect(profileService.updatePresentation).not.toHaveBeenCalled();
  });

  it('discards a draft without sending it to the API', async () => {
    const { user, editAbout, reviewProfile } = await openPresentation();
    await editAbout();
    await reviewProfile();
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(push).toHaveBeenCalledExactlyOnceWith('/profile');
    expect(profileService.updatePresentation).not.toHaveBeenCalled();
  });

  it('navigates once the server accepts the edited presentation', async () => {
    const response = Promise.withResolvers<ProfileResponse>();
    vi.mocked(profileService.updatePresentation).mockReturnValueOnce(
      response.promise,
    );
    const { user, editAbout, reviewProfile } = await openPresentation();
    await editAbout();
    await reviewProfile();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    for (const name of [
      'Guardando…',
      'Descartar cambios',
      'Continuar editando',
    ]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    expect(profileService.updatePresentation).toHaveBeenCalledExactlyOnceWith({
      headline: profile.headline,
      aboutMe: draft,
    });
    expect(push).not.toHaveBeenCalled();
    await act(async () => response.resolve({ ...profile, aboutMe: draft }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledExactlyOnceWith('/profile'),
    );
  });

  it('reviews the profile directly after a successful save from the form', async () => {
    const { user, editAbout, reviewProfile } = await openPresentation();
    await editAbout();
    await user.click(
      screen.getByRole('button', { name: 'Guardar presentación' }),
    );
    expect(
      await screen.findByText(
        PROFILE_FEEDBACK_MESSAGES.presentationSaveSuccess,
      ),
    ).toBeVisible();
    await reviewProfile();
    expect(push).toHaveBeenCalledExactlyOnceWith('/profile');
    expect(profileService.updatePresentation).toHaveBeenCalledTimes(1);
  });

  it('preserves the draft and shows the server error when saving fails', async () => {
    vi.mocked(profileService.updatePresentation).mockRejectedValueOnce(
      new Error('Unavailable'),
    );
    const { user, about, editAbout, reviewProfile } = await openPresentation();
    await editAbout();
    await reviewProfile();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(
      await screen.findByText(PROFILE_FEEDBACK_MESSAGES.saveError),
    ).toBeVisible();
    expect(about).toHaveValue(draft);
    expect(push).not.toHaveBeenCalled();
  });

  it('applies the regular required-field validation before leaving', async () => {
    const { user, about, reviewProfile } = await openPresentation();
    await user.clear(about);
    await reviewProfile();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(
      await screen.findByText(PROFILE_VALIDATION_MESSAGES.required),
    ).toBeVisible();
    expect(profileService.updatePresentation).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it.each(['untouched', 'restored'] as const)(
    'navigates directly when the presentation is %s',
    async (state) => {
      const { user, about, reviewProfile } = await openPresentation();
      if (state === 'restored') {
        await user.type(about, '!');
        await user.keyboard('{Backspace}');
      }
      await reviewProfile();
      expect(push).toHaveBeenCalledExactlyOnceWith('/profile');
      expect(
        screen.queryByRole('button', { name: 'Descartar cambios' }),
      ).not.toBeInTheDocument();
      expect(profileService.updatePresentation).not.toHaveBeenCalled();
    },
  );
});
