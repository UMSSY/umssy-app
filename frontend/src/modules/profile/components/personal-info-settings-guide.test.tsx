import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonalInfoValues } from '../types/personal-info-values.types';
import { PersonalInfoSettings } from './personal-info-settings';

const mocks = vi.hoisted(() => ({
  savePersonalInfo: vi.fn(),
  clearFeedback: vi.fn(),
  setProfile: vi.fn(),
  uploadPhoto: vi.fn(),
  isSavingContact: false,
}));

vi.mock('../services/portfolio-accounts.service', () => ({
  portfolioAccountsService: {
    getSocialAccounts: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../hooks/use-profile', () => ({
  useProfile: () => ({
    profile: {
      id: 'user-1',
      firstName: 'Romario',
      lastName: 'Via',
      institutionalEmail: 'romario@umss.edu',
      personalEmail: 'romario@example.test',
      phone: '70012345',
      city: { id: 'city-1', title: 'Cochabamba' },
      headline: null,
      aboutMe: null,
      updatedAt: '2026-11-14T12:00:00.000Z',
    },
    isLoading: false,
    error: null,
    setProfile: mocks.setProfile,
  }),
}));

vi.mock('../hooks/use-cities', () => ({
  useCities: () => ({
    cities: [{ id: 'city-1', title: 'Cochabamba' }],
    error: null,
  }),
}));

vi.mock('../hooks/use-save-profile', () => ({
  useSaveProfile: () => ({
    savePersonalInfo: mocks.savePersonalInfo,
    isSaving: mocks.isSavingContact,
    feedback: null,
    fieldErrors: {},
    clearFeedback: mocks.clearFeedback,
  }),
}));

vi.mock('../hooks/use-profile-photo', async () => {
  const { useState } = await import('react');
  return {
    useProfilePhoto() {
      const [previewUrl, setPreviewUrl] = useState<string | null>(null);
      const [photoUrl, setPhotoUrl] = useState<string | null>(null);
      const [isUploading, setIsUploading] = useState(false);
      return {
        photoUrl,
        previewUrl,
        isUploading,
        isDeleting: false,
        isLoading: false,
        error: null,
        loadError: null,
        selectPhoto: () => setPreviewUrl('blob:pending-photo'),
        cancelPhoto: () => setPreviewUrl(null),
        confirmPhoto: async () => {
          setIsUploading(true);
          await mocks.uploadPhoto();
          setPhotoUrl('blob:saved-photo');
          setPreviewUrl(null);
          setIsUploading(false);
        },
        deletePhoto: async () => undefined,
        reloadPhoto: async () => undefined,
      };
    },
  };
});

function renderGuide() {
  const guide = {
    onSaved: vi.fn(),
    onDirtyChange: vi.fn(),
    onBusyChange: vi.fn(),
  };
  const view = render(<PersonalInfoSettings guide={guide} />);
  const form = view.container.querySelector('form');
  if (!form) throw new Error('The contact form is unavailable');
  return { guide, form, user: userEvent.setup() };
}

async function selectPhoto(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText('Seleccionar fotografía de perfil'),
    new File(['photo'], 'perfil.png', { type: 'image/png' }),
  );
  expect(
    screen.getByText(/Vista previa: así se verá tu fotografía/),
  ).toBeVisible();
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSavingContact = false;
  mocks.savePersonalInfo.mockResolvedValue(true);
  mocks.uploadPhoto.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('PersonalInfoSettings in the profile guide', () => {
  it('treats a selected photo preview as an unsaved change before editing contact fields', async () => {
    const { guide, user } = renderGuide();
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(false);

    await selectPhoto(user);

    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(guide.onSaved).not.toHaveBeenCalled();
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it('keeps the pending photo dirty after saving contact changes', async () => {
    const { guide, form, user } = renderGuide();
    await selectPhoto(user);
    const firstName = screen.getByLabelText(/Nombres/);
    await user.clear(firstName);
    await user.type(firstName, 'Romario Andrés');

    await user.click(within(form).getByRole('button', { name: /^Guardar/ }));

    await waitFor(() => expect(guide.onSaved).toHaveBeenCalledTimes(1));
    expect(mocks.savePersonalInfo).toHaveBeenCalledWith(
      expect.objectContaining<Partial<PersonalInfoValues>>({
        firstName: 'Romario Andrés',
      }),
    );
    expect(
      screen.getByText(/Vista previa: así se verá tu fotografía/),
    ).toBeVisible();
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it('cancels contact edits without discarding a pending photo', async () => {
    const { guide, form, user } = renderGuide();
    await selectPhoto(user);
    const firstName = screen.getByLabelText(/Nombres/);
    await user.clear(firstName);
    await user.type(firstName, 'Otro nombre');

    await user.click(within(form).getByRole('button', { name: 'Cancelar' }));

    expect(firstName).toHaveValue('Romario');
    expect(
      screen.getByText(/Vista previa: así se verá tu fotografía/),
    ).toBeVisible();
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(guide.onSaved).not.toHaveBeenCalled();

    const cancelPhoto = screen
      .getAllByRole('button', { name: 'Cancelar' })
      .find((button) => !form.contains(button));
    if (!cancelPhoto)
      throw new Error('The photo cancellation action is unavailable');
    await user.click(cancelPhoto);

    expect(
      screen.queryByText(/Vista previa: así se verá tu fotografía/),
    ).not.toBeInTheDocument();
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('disables contact editing and submission throughout the photo upload', async () => {
    const pendingPhoto = deferred();
    mocks.uploadPhoto.mockReturnValueOnce(pendingPhoto.promise);
    const { guide, form, user } = renderGuide();
    await selectPhoto(user);
    await user.click(
      screen.getByRole('button', { name: 'Guardar fotografía' }),
    );

    expect(mocks.isSavingContact).toBe(false);
    expect(screen.getByLabelText(/Nombres/)).toBeDisabled();
    expect(screen.getByLabelText(/Apellidos/)).toBeDisabled();
    expect(screen.getByLabelText(/Teléfono/)).toBeDisabled();
    expect(screen.getByLabelText(/Correo personal/)).toBeDisabled();
    expect(
      within(form).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled();
    expect(form.querySelector('button[type="submit"]')).toBeDisabled();
    expect(guide.onBusyChange).toHaveBeenLastCalledWith(true);
    fireEvent.submit(form);
    expect(mocks.savePersonalInfo).not.toHaveBeenCalled();

    await act(async () => pendingPhoto.resolve());

    await waitFor(() =>
      expect(guide.onBusyChange).toHaveBeenLastCalledWith(false),
    );
    expect(screen.getByLabelText(/Nombres/)).toBeEnabled();
    expect(form.querySelector('button[type="submit"]')).toBeEnabled();
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(guide.onSaved).not.toHaveBeenCalled();
  });

  it('preserves dirty contact edits when a photo finishes saving', async () => {
    const { guide, user } = renderGuide();
    const firstName = screen.getByLabelText(/Nombres/);
    await user.clear(firstName);
    await user.type(firstName, 'Romario Andrés');
    await selectPhoto(user);
    await user.click(
      screen.getByRole('button', { name: 'Guardar fotografía' }),
    );

    await screen.findByRole('button', { name: 'Cambiar fotografía' });

    expect(firstName).toHaveValue('Romario Andrés');
    expect(guide.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(guide.onSaved).not.toHaveBeenCalled();
    expect(mocks.savePersonalInfo).not.toHaveBeenCalled();
  });
});
