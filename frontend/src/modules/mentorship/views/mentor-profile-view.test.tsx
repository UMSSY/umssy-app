import '@/shared/testing/indexed-db.mock';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { profileService } from '@/modules/profile/services/profile.service';
import {
  clearAccessToken,
  saveAccessToken,
} from '@/shared/services/storage/access-token-storage';

import * as service from '../services/mentor-profile.service';
import * as availability from '@/modules/availability';
import { MENTOR_PROFILE_FIXTURE } from '../testing/mentor-profile.fixture';
import { MentorProfileView } from './mentor-profile-view';
import * as similarService from '../services/similar-mentors.service';
import { SIMILAR_MENTORS_FIXTURE } from '../testing/similar-mentors.fixture';

beforeEach(() => {
  vi.spyOn(similarService, 'getSimilarMentors').mockResolvedValue([]);
});

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearAccessToken();
});

function mockCurrentUser(id: string) {
  return vi.spyOn(profileService, 'getProfile').mockResolvedValue({
    id,
    firstName: 'Ana',
    lastName: 'Rojas',
    institutionalEmail: 'ana@example.test',
    personalEmail: null,
    phone: null,
    city: null,
    headline: null,
    aboutMe: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
}

describe('MentorProfileView', () => {
  it('usa el UUID de Backend al solicitar mentoría desde Desarrollo', async () => {
    const backendId = '06d773ee-90d1-40c0-9744-c7c3601b84ef';
    const returnTo = '/mentorship/mentors?radarArea=desarrollo&area=Desarrollo+Web&areaId=ee0d0fe2-bc99-4a6a-8939-2bd663c3cae1';
    const request = vi.spyOn(availability, 'useRequestMentorship');
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue({
      ...MENTOR_PROFILE_FIXTURE,
      technicalAreas: [{ id: backendId, name: 'Backend', description: null }],
    });
    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} returnTo={returnTo} />);

    await screen.findByRole('heading', { name: MENTOR_PROFILE_FIXTURE.fullName, level: 1 });
    expect(request).toHaveBeenLastCalledWith(MENTOR_PROFILE_FIXTURE.id, 'Backend', returnTo, backendId);
  });
  it.each([false, true])(
    'recupera recomendaciones con refetch real, vacío=%s',
    async (empty) => {
      const user = userEvent.setup();
      vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
        MENTOR_PROFILE_FIXTURE,
      );
      vi.mocked(similarService.getSimilarMentors)
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(empty ? [] : SIMILAR_MENTORS_FIXTURE);
      render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);
      const section = await screen.findByRole('region', {
        name: 'También podría interesarte',
      });
      expect(await within(section).findByRole('alert')).toHaveTextContent(
        'No pudimos cargar los mentores similares',
      );
      expect(screen.getByRole('heading', { name: 'Ana Rojas' })).toBeVisible();
      await user.click(
        within(section).getByRole('button', { name: 'Reintentar' }),
      );
      if (empty) {
        expect(await within(section).findByRole('status')).toHaveTextContent(
          'No hay mentores similares disponibles',
        );
        expect(within(section).queryByRole('link')).not.toBeInTheDocument();
      } else {
        expect(await within(section).findAllByRole('link')).toHaveLength(3);
      }
      expect(similarService.getSimilarMentors).toHaveBeenCalledTimes(2);
      expect(within(section).queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('cambia el perfil y las recomendaciones al cambiar el ID de la ruta', async () => {
    const next = SIMILAR_MENTORS_FIXTURE[0];
    const profile = vi
      .spyOn(service, 'getMentorProfile')
      .mockResolvedValueOnce(MENTOR_PROFILE_FIXTURE)
      .mockResolvedValueOnce({
        ...MENTOR_PROFILE_FIXTURE,
        id: next.id,
        fullName: next.fullName,
      });
    vi.mocked(similarService.getSimilarMentors)
      .mockResolvedValueOnce([next])
      .mockResolvedValueOnce([SIMILAR_MENTORS_FIXTURE[1]]);
    const { rerender } = render(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );
    const link = await screen.findByRole('link', {
      name: `Ver perfil de ${next.fullName}`,
    });
    expect(link.getAttribute('href')?.split('?')[0]).toBe(
      `/mentors/${next.id}`,
    );
    rerender(<MentorProfileView mentorId={next.id} />);
    expect(
      await screen.findByRole('heading', { name: next.fullName, level: 1 }),
    ).toBeVisible();
    expect(
      await screen.findByRole('link', {
        name: `Ver perfil de ${SIMILAR_MENTORS_FIXTURE[1].fullName}`,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: `Ver perfil de ${next.fullName}` }),
    ).not.toBeInTheDocument();
    expect(profile).toHaveBeenLastCalledWith(next.id, expect.any(AbortSignal));
    expect(similarService.getSimilarMentors).toHaveBeenLastCalledWith(
      next.id,
      expect.any(AbortSignal),
    );
  });

  it('mantiene el perfil visible mientras cargan los mentores similares', async () => {
    vi.mocked(similarService.getSimilarMentors).mockReturnValue(
      new Promise(() => {}),
    );
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );
    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);
    expect(
      await screen.findByRole('heading', { name: 'Ana Rojas' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Sobre mí' })).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Trayectoria actual' }),
    ).toBeVisible();
    const section = screen.getByRole('region', {
      name: 'También podría interesarte',
    });
    expect(section).toHaveAttribute('aria-busy', 'true');
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Cargando mentores similares...',
    );
  });
  it('muestra intereses profesionales reales', async () => {
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );
    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);
    expect(
      await screen.findByRole('heading', { name: 'Intereses profesionales' }),
    ).toBeInTheDocument();
    for (const skill of MENTOR_PROFILE_FIXTURE.skills)
      expect(screen.getByText(skill.name)).toBeInTheDocument();
  });

  it('informa un perfil sin nombre en lugar de presentar datos vacíos', async () => {
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue({
      ...MENTOR_PROFILE_FIXTURE,
      fullName: ' ',
    });
    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);
    expect(await screen.findByText('Perfil incompleto')).toBeInTheDocument();
    expect(similarService.getSimilarMentors).not.toHaveBeenCalled();
    expect(screen.queryByText('Solicitar mentoría')).not.toBeInTheDocument();
  });

  it('muestra la información real del mentor', async () => {
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );

    const { container } = render(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );

    expect((await screen.findAllByText('Ana Rojas')).length).toBeGreaterThan(0);
    expect(screen.getByText('Arquitecta de Software')).toBeInTheDocument();
    expect(screen.getAllByText('Backend')).toHaveLength(2);
    expect(screen.getAllByText('Arquitectura')).toHaveLength(2);
    expect(screen.getByText('Orientación técnica')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sobre mí' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Trayectoria actual' }),
    ).toBeInTheDocument();
    const grid = container.querySelector('main > div > div.grid');
    expect(grid).toHaveClass(
      'lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)]',
    );
    const recommendations = screen.getByRole('region', {
      name: 'También podría interesarte',
    });
    expect(container.querySelector('main > div')?.lastElementChild).toBe(
      recommendations,
    );
    expect(recommendations.previousElementSibling).toBe(grid);
  });

  it('maneja campos opcionales nulos sin inventar contenido', async () => {
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue({
      ...MENTOR_PROFILE_FIXTURE,
      headline: null,
      aboutMe: null,
      photoUrl: null,
      city: null,
      educations: [],
      workExperiences: [],
      skills: [],
      certifications: [],
      technicalAreas: [],
      orientationTypes: [],
    });

    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);

    expect(
      await screen.findByRole('heading', { name: 'Ana Rojas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Sobre mí')).not.toBeInTheDocument();
    expect(screen.queryByText('Trayectoria actual')).not.toBeInTheDocument();
    expect(
      screen.getByText('No hay áreas técnicas registradas.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Este mentor todavía no registró tipos de orientación.'),
    ).toBeInTheDocument();
  });

  it('muestra mensaje cuando el mentor no existe', async () => {
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(null);

    render(<MentorProfileView mentorId="not-a-valid-mentor-id" />);

    expect(await screen.findByText('Mentor no encontrado')).toBeInTheDocument();
    expect(similarService.getSimilarMentors).not.toHaveBeenCalled();
    expect(
      screen.getByText('No se pudo encontrar el perfil solicitado.'),
    ).toBeInTheDocument();
  });

  it.each([true, false])(
    'oculta la solicitud en el perfil propio con disponibilidad %s',
    async (isAvailable) => {
      await saveAccessToken('test-token');
      mockCurrentUser(MENTOR_PROFILE_FIXTURE.id);
      vi.spyOn(service, 'getMentorProfile').mockResolvedValue({
        ...MENTOR_PROFILE_FIXTURE,
        isAvailable,
      });

      const { client } = render(
        <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
      );

      expect(
        await screen.findByRole('heading', { name: 'Ana Rojas' }),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          client.getQueryState(['mentorship', 'current-user', 'test-token'])
            ?.status,
        ).toBe('success'),
      );
      expect(profileService.getProfile).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Solicitar mentoría')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Sobre mí' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Trayectoria actual' }),
      ).toBeInTheDocument();
      const header = screen
        .getByRole('heading', { name: 'Ana Rojas' })
        .closest('[data-slot="card"]');
      expect(
        within(header as HTMLElement).getByText(
          isAvailable ? 'Disponible para mentoría' : 'No disponible',
        ),
      ).toBeInTheDocument();
    },
  );

  it('conserva la acción habilitada de otro mentor disponible', async () => {
    await saveAccessToken('test-token');
    mockCurrentUser('0fa5e6de-63a4-430e-87fb-22f5eb700ecd');
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );

    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);

    expect(
      await screen.findByRole('button', { name: 'Solicitar mentoría' }),
    ).toBeEnabled();
  });

  it('mantiene deshabilitada la acción de otro mentor no disponible, con el texto del CA6', async () => {
    await saveAccessToken('test-token');
    mockCurrentUser('0fa5e6de-63a4-430e-87fb-22f5eb700ecd');
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue({
      ...MENTOR_PROFILE_FIXTURE,
      isAvailable: false,
    });

    render(<MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />);

    expect(
      await screen.findByRole('button', {
        name: 'Este mentor no está recibiendo solicitudes por ahora',
      }),
    ).toBeDisabled();
  });

  it('no muestra la solicitud mientras se resuelve la identidad', async () => {
    await saveAccessToken('test-token');
    let resolveProfile: (
      value: Awaited<ReturnType<typeof profileService.getProfile>>,
    ) => void = () => {};
    vi.spyOn(profileService, 'getProfile').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );

    const { client } = render(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Ana Rojas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Solicitar mentoría')).not.toBeInTheDocument();
    resolveProfile({
      id: MENTOR_PROFILE_FIXTURE.id,
      firstName: 'Ana',
      lastName: 'Rojas',
      institutionalEmail: 'ana@example.test',
      personalEmail: null,
      phone: null,
      city: null,
      headline: null,
      aboutMe: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await waitFor(() =>
      expect(
        client.getQueryState(['mentorship', 'current-user', 'test-token'])
          ?.status,
      ).toBe('success'),
    );
    expect(profileService.getProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Solicitar mentoría')).not.toBeInTheDocument();
  });

  it('no habilita solicitudes si falla la consulta de identidad', async () => {
    await saveAccessToken('test-token');
    vi.spyOn(profileService, 'getProfile').mockRejectedValue(
      new Error('invalid session'),
    );
    vi.spyOn(service, 'getMentorProfile').mockResolvedValue(
      MENTOR_PROFILE_FIXTURE,
    );

    const { client } = render(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Ana Rojas' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        client.getQueryState(['mentorship', 'current-user', 'test-token'])
          ?.status,
      ).toBe('error'),
    );
    expect(profileService.getProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Solicitar mentoría')).not.toBeInTheDocument();
  });
});
