import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { EducationProfileSection } from '@/modules/education';
import { WorkExperienceProfileSection } from '@/modules/work-experience';
import { CertificationProfileSection } from '@/modules/certifications';
import { SkillsProfileSection } from '@/modules/skills';
import { DEGREE_CATALOG_FIXTURE } from '@/modules/education/testing/degree-catalog.fixture';
import { PersonalInfoSettings } from '../components/personal-info-settings';
import { PresentationSettings } from '../components/presentation-settings';
import { ProfileCompletenessProgress } from '../components/profile-completeness-progress';
import {
  PROFILE_COMPLETENESS_SECTION_IDS,
  PROFILE_COMPLETENESS_SECTION_LABELS,
} from '../constants/profile-completeness.constants';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import { createProfileCompleteness } from './profile-completeness.fixture';

const api = vi.hoisted(() => ({
  completeness: vi.fn(),
  profile: vi.fn(),
  contact: vi.fn(),
  presentation: vi.fn(),
  education: vi.fn(),
  experience: vi.fn(),
  certification: vi.fn(),
  skills: vi.fn(),
  mySkills: vi.fn(),
}));

vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({ currentUserId: 'user-a', isLoading: false }),
}));
vi.mock('../services/profile-completeness.service', () => ({
  profileCompletenessService: { getCompleteness: api.completeness },
}));
vi.mock('../services/profile.service', () => ({
  profileService: {
    getProfile: api.profile,
    updatePersonalInfo: api.contact,
    updatePresentation: api.presentation,
    getCities: vi
      .fn()
      .mockResolvedValue([{ id: 'city-1', title: 'Cochabamba' }]),
  },
}));
vi.mock('../services/profile-photo.service', () => ({
  profilePhotoService: { getPhoto: vi.fn().mockResolvedValue(null) },
}));
vi.mock('@/modules/education/services/educations.service', () => ({
  educationsService: {
    getEducations: vi.fn().mockResolvedValue([]),
    createEducation: api.education,
    getInstitutions: vi
      .fn()
      .mockResolvedValue([
        { name: 'Universidad Mayor de San Simón (UMSS)', aliases: ['UMSS'] },
      ]),
    getDegrees: vi.fn(async () => DEGREE_CATALOG_FIXTURE),
  },
}));
vi.mock('@/modules/work-experience/services/work-experience.service', () => ({
  workExperienceService: {
    getWorkExperiences: vi.fn().mockResolvedValue([]),
    createWorkExperience: api.experience,
  },
}));
vi.mock('@/modules/matching/services/skills-analysis.service', () => ({
  skillsAnalysisService: {
    analyzeExperience: vi.fn().mockResolvedValue({ skills: [] }),
    previewExperience: vi.fn().mockResolvedValue({ skills: [] }),
  },
}));
vi.mock('../services/profile-skills-radar.service', () => ({
  profileSkillsRadarService: {
    analyzeSkills: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@/modules/certifications/services/certifications.service', () => ({
  certificationsService: {
    getCertifications: vi.fn().mockResolvedValue([]),
    createWithDocument: api.certification,
  },
}));
vi.mock('@/modules/skills/services/skills.service', () => ({
  skillsService: {
    getCatalog: vi.fn().mockResolvedValue([{ id: 'react', name: 'React' }]),
    getMySkills: api.mySkills,
    saveMySkills: api.skills,
    getDetectedSkills: vi
      .fn()
      .mockResolvedValue({ status: 'error', skills: [] }),
  },
}));

const PROFILE = {
  id: 'user-a',
  firstName: 'Ana',
  lastName: 'Rojas',
  institutionalEmail: 'ana@umss.edu',
  personalEmail: null,
  phone: '+591 70000000',
  city: { id: 'city-1', title: 'Cochabamba' },
  headline: null,
  aboutMe: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

type User = ReturnType<typeof userEvent.setup>;

async function fillPresentation(user: User) {
  await user.type(
    await screen.findByLabelText(/Titular profesional/),
    'Ingeniera',
  );
  await user.type(
    screen.getByLabelText(/Acerca de/),
    'Desarrollo aplicaciones web.',
  );
}

const cases = [
  {
    section: 'contact',
    Editor: PersonalInfoSettings,
    request: api.contact,
    submit: 'Guardar perfil',
    fill: async (user: User) => {
      await user.type(
        await screen.findByLabelText(/Correo personal/),
        'ana@example.test',
      );
    },
  },
  {
    section: 'presentation',
    Editor: PresentationSettings,
    request: api.presentation,
    submit: 'Guardar presentación',
    fill: fillPresentation,
  },
  {
    section: 'education',
    Editor: EducationProfileSection,
    request: api.education,
    submit: 'Guardar formación',
    fill: async (user: User) => {
      await user.click(
        await screen.findByRole('button', { name: 'Añadir formación' }),
      );
      await waitFor(() =>
        expect(screen.getByLabelText(/Institución/)).toBeEnabled(),
      );
      fireEvent.change(screen.getByLabelText(/Institución/), {
        target: { value: 'Universidad Mayor de San Simón (UMSS)' },
      });
      fireEvent.change(screen.getByLabelText(/Título o carrera/), {
        target: { value: 'Ingeniería Informática' },
      });
      fireEvent.change(screen.getByLabelText(/Desde/), {
        target: { value: '2020-01-01' },
      });
      fireEvent.change(screen.getByLabelText(/Hasta/), {
        target: { value: '2024-01-01' },
      });
    },
  },
  {
    section: 'work-experience',
    Editor: WorkExperienceProfileSection,
    request: api.experience,
    submit: 'Guardar experiencia',
    fill: async (user: User) => {
      await user.click(
        await screen.findByRole('button', { name: 'Añadir experiencia' }),
      );
      await user.type(screen.getByLabelText(/Empresa/), 'UMSS');
      await user.type(screen.getByLabelText(/Cargo/), 'Desarrolladora');
      fireEvent.change(screen.getByLabelText(/Desde/), {
        target: { value: '2024-01-01' },
      });
      await user.click(
        screen.getByRole('checkbox', { name: 'Trabajo actualmente aquí' }),
      );
      await user.type(
        screen.getByLabelText(/Descripción de funciones/),
        'Desarrollo de aplicaciones web.',
      );
    },
  },
  {
    section: 'certifications',
    Editor: CertificationProfileSection,
    request: api.certification,
    submit: 'Guardar certificación',
    fill: async (user: User) => {
      await user.click(
        await screen.findByRole('button', { name: 'Agregar certificación' }),
      );
      await user.type(
        screen.getByLabelText(/Nombre de la certificación/),
        'CCNA',
      );
      await user.type(screen.getByLabelText(/Entidad emisora/), 'Cisco');
      fireEvent.change(screen.getByLabelText(/Fecha de obtención/), {
        target: { value: '2024-01-01' },
      });
      await user.upload(
        screen.getByLabelText(/Archivo de respaldo/),
        new File(['certificate'], 'certificate.pdf', {
          type: 'application/pdf',
        }),
      );
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Guardar certificación' }),
        ).toBeEnabled(),
      );
    },
  },
  {
    section: 'skills',
    Editor: SkillsProfileSection,
    request: api.skills,
    submit: 'Añadir React',
    fill: async (user: User) => {
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Añadir habilidad' }),
        ).toBeEnabled(),
      );
      await user.click(
        screen.getByRole('button', { name: 'Añadir habilidad' }),
      );
    },
  },
] satisfies {
  section: ProfileCompletenessSectionId;
  Editor: () => React.JSX.Element;
  request: ReturnType<typeof vi.fn>;
  submit: string;
  fill: (user: User) => Promise<void>;
}[];

beforeEach(() => {
  for (const request of Object.values(api)) request.mockReset();
  api.completeness.mockResolvedValue(createProfileCompleteness());
  api.profile.mockResolvedValue(PROFILE);
  api.mySkills.mockResolvedValue([]);
  for (const request of [api.contact, api.presentation])
    request.mockResolvedValue(PROFILE);
  for (const request of [api.education, api.experience, api.certification])
    request.mockResolvedValue({ id: 'saved' });
  api.skills.mockResolvedValue([{ id: 'react', name: 'React' }]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function expectProgress(
  section: ProfileCompletenessSectionId,
  completed: boolean,
  percentage: number,
) {
  expect(screen.getByRole('progressbar', { hidden: true })).toHaveAttribute(
    'aria-valuenow',
    String(percentage),
  );
  expect(
    screen.getByRole('listitem', {
      name: `${PROFILE_COMPLETENESS_SECTION_LABELS[section]}: ${completed ? 'Completada' : 'Pendiente'}`,
      hidden: true,
    }),
  ).toBeInTheDocument();
}

describe('Profile completeness after saving from the interface', () => {
  it.each(cases)(
    'updates the bar and checklist after saving $section without remounting',
    async ({ section, Editor, fill, request, submit }) => {
      const user = userEvent.setup();
      render(
        <>
          <ProfileCompletenessProgress />
          <Editor />
        </>,
      );
      const bar = await screen.findByRole('progressbar');
      await fill(user);
      expectProgress(section, false, 0);
      expect(api.completeness).toHaveBeenCalledOnce();
      const saved = createProfileCompleteness([section]);
      // The new server state becomes available only after the write succeeds.
      const savedValue =
        section === 'skills'
          ? [{ id: 'react', name: 'React' }]
          : { ...PROFILE, id: 'saved' };
      request.mockImplementationOnce(async () => {
        api.completeness.mockResolvedValue(saved);
        return savedValue;
      });
      await user.click(screen.getByRole('button', { name: submit }));
      await waitFor(() => expectProgress(section, true, saved.percentage));
      expect(screen.getByRole('progressbar', { hidden: true })).toBe(bar);
      expect(
        screen.getByText('1 de 6 secciones completadas'),
      ).toBeInTheDocument();
      expect(api.completeness).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenCalledOnce();
    },
  );

  it('preserves the pending state after a rejected save and updates on retry', async () => {
    const user = userEvent.setup();
    api.presentation.mockRejectedValueOnce(new Error('Write failed'));
    render(
      <>
        <ProfileCompletenessProgress />
        <PresentationSettings />
      </>,
    );
    await screen.findByRole('progressbar');
    await fillPresentation(user);
    await user.click(
      screen.getByRole('button', { name: 'Guardar presentación' }),
    );
    await screen.findByRole('alert');
    expectProgress('presentation', false, 0);
    expect(api.completeness).toHaveBeenCalledOnce();
    api.presentation.mockImplementationOnce(async () => {
      api.completeness.mockResolvedValue(
        createProfileCompleteness(['presentation']),
      );
      return {
        ...PROFILE,
        headline: 'Ingeniera',
        aboutMe: 'Desarrollo aplicaciones web.',
      };
    });
    await user.click(
      screen.getByRole('button', { name: 'Guardar presentación' }),
    );
    await waitFor(() => expectProgress('presentation', true, 15));
  });

  it('shows the refreshed checklist when returning after saving in settings with the indicator unmounted', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ProfileCompletenessProgress />);
    await screen.findByRole('progressbar');
    rerender(<PresentationSettings />);
    await fillPresentation(user);
    api.presentation.mockImplementationOnce(async () => {
      api.completeness.mockResolvedValue(
        createProfileCompleteness(['presentation']),
      );
      return {
        ...PROFILE,
        headline: 'Ingeniera',
        aboutMe: 'Desarrollo aplicaciones web.',
      };
    });
    await user.click(
      screen.getByRole('button', { name: 'Guardar presentación' }),
    );
    await screen.findByText('Tu presentación se guardó correctamente.');
    rerender(<ProfileCompletenessProgress />);
    await waitFor(() => expectProgress('presentation', true, 15));
  });

  it('collapses at 100 percent and reopens pending sections after removing the last saved skill', async () => {
    const user = userEvent.setup();
    const withoutSkills = PROFILE_COMPLETENESS_SECTION_IDS.filter(
      (id) => id !== 'skills',
    );
    api.completeness.mockResolvedValue(
      createProfileCompleteness(withoutSkills),
    );
    render(
      <>
        <ProfileCompletenessProgress />
        <SkillsProfileSection />
      </>,
    );
    const bar = await screen.findByRole('progressbar');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Añadir habilidad' }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Añadir habilidad' }));
    api.skills.mockImplementationOnce(async () => {
      api.completeness.mockResolvedValue(
        createProfileCompleteness(PROFILE_COMPLETENESS_SECTION_IDS),
      );
      return [{ id: 'react', name: 'React' }];
    });
    await user.click(screen.getByRole('button', { name: 'Añadir React' }));
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '100'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('region', { name: 'Secciones del perfil' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ver secciones del perfil' }),
    );
    expect(
      within(
        screen.getByRole('region', { name: 'Secciones del perfil' }),
      ).getAllByText('Completada'),
    ).toHaveLength(6);
    api.skills.mockImplementationOnce(async () => {
      api.completeness.mockResolvedValue(
        createProfileCompleteness(withoutSkills),
      );
      return [];
    });
    await user.click(screen.getByRole('button', { name: 'Quitar React' }));
    await waitFor(() => expectProgress('skills', false, 85));
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('region', { name: 'Secciones del perfil' }),
    ).toBeVisible();
  });

  it('keeps the last confirmed percentage during a slow refresh and updates both values together', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProfileCompletenessProgress />
        <PresentationSettings />
      </>,
    );
    await screen.findByRole('progressbar');
    await fillPresentation(user);
    let resolveRefresh!: (
      value: ReturnType<typeof createProfileCompleteness>,
    ) => void;
    api.completeness.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Guardar presentación' }),
    );
    await waitFor(() => expect(api.completeness).toHaveBeenCalledTimes(2));
    expectProgress('presentation', false, 0);
    await act(async () => {
      resolveRefresh(createProfileCompleteness(['presentation']));
    });
    await waitFor(() => expectProgress('presentation', true, 15));
  });
});
