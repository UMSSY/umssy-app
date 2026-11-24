import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { availabilityApi } from '@/modules/availability';
import { educationsService } from '@/modules/educations';
import {
  profilePhotoService,
  profileService,
  type ProfileResponse,
} from '@/modules/profile';
import { workExperienceService } from '@/modules/work-experience';
import { mentorProfileSuggestionsService } from '../../services/mentor-profile-suggestions.service';
import { ParticipationOverview } from './participation-overview';

const suggestions = [
  ['MISSING_PROFILE_PHOTO', 'photoUrl', 'Agrega tu fotografía'],
  [
    'MISSING_PROFESSIONAL_DESCRIPTION',
    'aboutMe',
    'Completa tu descripción profesional',
  ],
  ['MISSING_SPECIALTY', 'mentorTechnicalAreas', 'Completa tus áreas técnicas'],
  [
    'MISSING_WORK_EXPERIENCE',
    'workExperiences',
    'Registra tu experiencia laboral',
  ],
].map(([code, field, title]) => ({
  code,
  field,
  title,
  message: title,
  benefitDescription: 'Beneficio del backend',
  editReference: { section: field, action: 'edit' },
})) as Awaited<
  ReturnType<typeof mentorProfileSuggestionsService.getMySuggestions>
>['suggestions'];

const profile: ProfileResponse = {
  id: 'mentor-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  institutionalEmail: 'ana@umss.edu',
  personalEmail: null,
  phone: null,
  city: null,
  headline: null,
  aboutMe: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
};

function renderOverview(
  isActive = true,
  areas: string[] = [],
  orientations: string[] = [],
) {
  return renderWithQuery(
    <ParticipationOverview
      isActive={isActive}
      areas={areas}
      orientations={orientations}
      onAction={vi.fn()}
      onPreview={vi.fn()}
    />,
  );
}

describe('recomendaciones de participación HU-MEN-13', () => {
  beforeEach(() => {
    vi.spyOn(
      mentorProfileSuggestionsService,
      'getMySuggestions',
    ).mockResolvedValue({ suggestions, pendingCount: 4 });

    vi.spyOn(profileService, 'getProfile').mockResolvedValue(profile);
    vi.spyOn(profilePhotoService, 'getPhoto').mockResolvedValue(null);
    vi.spyOn(workExperienceService, 'getWorkExperiences').mockResolvedValue([]);
    vi.spyOn(educationsService, 'getEducations').mockResolvedValue([]);
    vi.spyOn(availabilityApi, 'getAvailabilityBlocks').mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra ocho sugerencias opcionales con enlaces de edición reales', async () => {
    renderOverview();

    const section = await screen.findByRole('region', {
      name: 'Recomendaciones para mejorar tu perfil',
    });

    await waitFor(() =>
      expect(within(section).getAllByRole('listitem')).toHaveLength(8),
    );

    expect(within(section).getByText('4 pendientes')).toBeInTheDocument();
    expect(within(section).queryByText(/HU-13/)).not.toBeInTheDocument();

    expect(
      within(section).getByRole('region', {
        name: 'Sugerencias de perfil',
      }),
    ).toBeInTheDocument();

    expect(
      within(section).getByRole('region', {
        name: 'Recomendaciones adicionales',
      }),
    ).toBeInTheDocument();

    expect(
      within(section).getByText(/sugerencias son opcionales/),
    ).toBeInTheDocument();

    const links = within(section).getAllByRole('link');

    expect(
      links.map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Editar fotografía', '/profile/personal-info'],
      ['Editar descripción', '/profile/presentation'],
      ['Editar áreas técnicas', '/mentors/participation/technical-areas'],
      ['Editar experiencia', '/profile/trajectory/experience'],
      ['Editar titular', '/profile/presentation'],
      ['Editar formación', '/profile/trajectory/education'],
      ['Editar orientaciones', '/mentorship/orientation'],
      ['Editar disponibilidad', '/mentor/availability'],
    ]);
  });

  it('oculta solo los apartados completados', async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({
      ...profile,
      aboutMe: 'Mentora en desarrollo',
    });

    vi.mocked(profilePhotoService.getPhoto).mockResolvedValue(
      new Blob(['foto']),
    );

    vi.mocked(
      mentorProfileSuggestionsService.getMySuggestions,
    ).mockResolvedValue({ suggestions: suggestions.slice(3), pendingCount: 1 });

    renderOverview(true, ['Backend'], []);

    const section = await screen.findByRole('region', {
      name: 'Recomendaciones para mejorar tu perfil',
    });

    await waitFor(() =>
      expect(within(section).getAllByRole('listitem')).toHaveLength(5),
    );

    expect(
      within(section).queryByText('Agrega una foto de perfil'),
    ).not.toBeInTheDocument();

    expect(
      within(section).queryByText('Configura tus áreas técnicas'),
    ).not.toBeInTheDocument();

    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('no presenta recomendaciones cuando todo lo evaluado está completo', async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({
      ...profile,
      aboutMe: 'Mentora',
      headline: 'Ingeniera',
    });

    vi.mocked(profilePhotoService.getPhoto).mockResolvedValue(
      new Blob(['foto']),
    );

    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([
      {},
    ] as Awaited<ReturnType<typeof workExperienceService.getWorkExperiences>>);

    vi.mocked(educationsService.getEducations).mockResolvedValue([
      {},
    ] as Awaited<ReturnType<typeof educationsService.getEducations>>);

    vi.mocked(availabilityApi.getAvailabilityBlocks).mockResolvedValue([
      {},
    ] as Awaited<ReturnType<typeof availabilityApi.getAvailabilityBlocks>>);

    vi.mocked(
      mentorProfileSuggestionsService.getMySuggestions,
    ).mockResolvedValue({ suggestions: [], pendingCount: 0 });

    renderOverview(true, ['Backend'], ['Empleo']);

    await waitFor(() => expect(profileService.getProfile).toHaveBeenCalled());

    await waitFor(() =>
      expect(
        screen.queryByRole('region', {
          name: 'Recomendaciones para mejorar tu perfil',
        }),
      ).not.toBeInTheDocument(),
    );
  });

  it('no consulta ni muestra recomendaciones sin participación activa', () => {
    renderOverview(false);

    expect(
      screen.queryByRole('region', {
        name: 'Recomendaciones para mejorar tu perfil',
      }),
    ).not.toBeInTheDocument();

    expect(profileService.getProfile).not.toHaveBeenCalled();

    expect(
      mentorProfileSuggestionsService.getMySuggestions,
    ).not.toHaveBeenCalled();
  });

  it('vuelve a consultar al regresar y quita la recomendación completada', async () => {
    const first = renderOverview();

    const section = await screen.findByRole('region', {
      name: 'Recomendaciones para mejorar tu perfil',
    });

    await within(section).findByText('Completa tu descripción profesional');

    first.unmount();

    vi.mocked(profileService.getProfile).mockResolvedValue({
      ...profile,
      aboutMe: 'Mentora en sistemas',
    });

    vi.mocked(
      mentorProfileSuggestionsService.getMySuggestions,
    ).mockResolvedValue({
      suggestions: suggestions.filter(
        (item) => item.code !== 'MISSING_PROFESSIONAL_DESCRIPTION',
      ),
      pendingCount: 3,
    });

    renderOverview();

    await waitFor(() =>
      expect(
        mentorProfileSuggestionsService.getMySuggestions,
      ).toHaveBeenCalledTimes(2),
    );

    await waitFor(() =>
      expect(
        screen.queryByText('Completa tu descripción profesional'),
      ).not.toBeInTheDocument(),
    );
  });

  it('conserva las recomendaciones al volver sin guardar', async () => {
    const first = renderOverview();

    await screen.findByText('Agrega tu fotografía');

    first.unmount();

    renderOverview();

    expect(await screen.findByText('Agrega tu fotografía')).toBeInTheDocument();

    expect(screen.getByText('4 pendientes')).toBeInTheDocument();
  });

  it('no trata un error de carga como un campo incompleto y conserva las otras sugerencias', async () => {
    vi.mocked(
      mentorProfileSuggestionsService.getMySuggestions,
    ).mockRejectedValue(new Error('HTTP 500'));

    vi.mocked(availabilityApi.getAvailabilityBlocks).mockRejectedValue(
      new Error('HTTP 500'),
    );

    renderOverview();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo consultar toda tu información',
    );

    expect(
      screen.queryByText('Completa tu descripción profesional'),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('Configura tu disponibilidad'),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('Registra tu formación profesional'),
    ).toBeInTheDocument();

    expect(screen.queryByText(/^\d+ pendientes?$/)).not.toBeInTheDocument();
  });

  it('respeta una sola sugerencia del backend aunque otros campos locales estén vacíos', async () => {
    vi.mocked(
      mentorProfileSuggestionsService.getMySuggestions,
    ).mockResolvedValue({
      suggestions: suggestions.slice(0, 1),
      pendingCount: 1,
    });

    renderOverview();

    const primary = await screen.findByRole('region', {
      name: 'Sugerencias de perfil',
    });

    expect(within(primary).getAllByRole('listitem')).toHaveLength(1);

    expect(screen.getByText('1 pendiente')).toBeInTheDocument();

    expect(screen.queryByText(/HU-13/)).not.toBeInTheDocument();

    expect(profilePhotoService.getPhoto).not.toHaveBeenCalled();

    expect(workExperienceService.getWorkExperiences).not.toHaveBeenCalled();

    expect(
      screen.getByRole('region', {
        name: 'Recomendaciones adicionales',
      }),
    ).toBeInTheDocument();
  });
});
