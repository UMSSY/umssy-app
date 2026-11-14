import { StrictMode } from 'react';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import {
  EducationProfileSection,
  educationsService,
} from '@/modules/education';
import {
  WorkExperienceProfileSection,
  workExperienceService,
} from '@/modules/work-experience';
import {
  CertificationProfileSection,
  certificationsService,
} from '@/modules/certifications';
import { SkillsProfileSection, skillsService } from '@/modules/skills';
import { DEGREE_CATALOG_FIXTURE } from '@/modules/education/testing/degree-catalog.fixture';
import { PersonalInfoForm } from '../components/personal-info-form';
import { PresentationForm } from '../components/presentation-form';
import { ProfileCompletenessChecklist } from '../components/profile-completeness-checklist';
import { createProfileCompleteness } from './profile-completeness.fixture';

vi.mock('@/modules/education/services/educations.service', () => ({
  educationsService: {
    getEducations: vi.fn(),
    getInstitutions: vi.fn(),
    getDegrees: vi.fn(),
  },
}));
vi.mock('@/modules/work-experience/services/work-experience.service', () => ({
  workExperienceService: { getWorkExperiences: vi.fn() },
}));
vi.mock('@/modules/certifications/services/certifications.service', () => ({
  certificationsService: { getCertifications: vi.fn() },
}));
vi.mock('@/modules/skills/services/skills.service', () => ({
  skillsService: {
    getCatalog: vi.fn(),
    getMySkills: vi.fn(),
    getDetectedSkills: vi.fn(),
  },
}));

const scrollIntoView = vi.fn();
const institutions = [
  { name: 'Universidad Mayor de San Simón (UMSS)', aliases: ['UMSS'] },
];
const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
);

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  vi.mocked(educationsService.getEducations).mockResolvedValue([]);
  vi.mocked(educationsService.getInstitutions).mockResolvedValue(institutions);
  vi.mocked(educationsService.getDegrees).mockResolvedValue(
    DEGREE_CATALOG_FIXTURE,
  );
  vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([]);
  vi.mocked(certificationsService.getCertifications).mockResolvedValue([]);
  vi.mocked(skillsService.getCatalog).mockResolvedValue([]);
  vi.mocked(skillsService.getMySkills).mockResolvedValue([]);
  vi.mocked(skillsService.getDetectedSkills).mockResolvedValue({
    status: 'ready',
    skills: [],
  });
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  if (originalScrollIntoView)
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      originalScrollIntoView,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('Completing a profile section from the checklist', () => {
  it.each([
    { label: 'Formación académica', field: /Institución/, close: 'Cancelar' },
    { label: 'Experiencia laboral', field: /Empresa/, close: 'Cancelar' },
    {
      label: 'Certificaciones',
      field: /Nombre de la certificación/,
      close: 'Cancelar',
    },
    { label: 'Habilidades', field: /^Habilidad$/, close: 'Cerrar habilidades' },
  ])(
    'opens only the $label editor directly from the checklist and can reopen it',
    async ({ label, field, close }) => {
      const user = userEvent.setup();
      window.history.replaceState(null, '', '/profile');
      render(
        <StrictMode>
          <ProfileCompletenessChecklist
            sections={createProfileCompleteness([]).sections}
          />
          <EducationProfileSection />
          <WorkExperienceProfileSection />
          <CertificationProfileSection />
          <SkillsProfileSection />
        </StrictMode>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      for (let attempt = 0; attempt < 2; attempt++) {
        await user.click(
          screen.getByRole('link', { name: `Completar ${label}` }),
        );
        await screen.findByRole('dialog');
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        await waitFor(() => expect(screen.getByLabelText(field)).toHaveFocus());
        expect(window.location.pathname).toBe('/profile');
        expect(window.location.hash).toBe('');
        await user.click(screen.getByRole('button', { name: close }));
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
      }
    },
  );

  it('focuses the first empty contact field, including the city selector', () => {
    window.history.replaceState(null, '', '/profile/settings#complete-contact');
    render(
      <PersonalInfoForm
        initialValues={{
          firstName: 'Ana',
          lastName: 'Pérez',
          cityId: '',
          phone: '',
          personalEmail: '',
        }}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: /Ciudad de residencia/ }),
    ).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('preserves saved values, query and router state without stealing focus while typing', async () => {
    const user = userEvent.setup();
    const state = { __NA: true, tree: ['profile'] };
    window.history.replaceState(
      state,
      '',
      '/profile/settings?source=profile#complete-presentation',
    );
    render(
      <StrictMode>
        <PresentationForm
          initialValues={{ headline: 'Ingeniera', aboutMe: '' }}
          onSubmit={vi.fn()}
        />
      </StrictMode>,
    );
    const aboutMe = screen.getByLabelText(/Acerca de/);
    expect(aboutMe).toHaveFocus();
    expect(screen.getByLabelText(/Titular profesional/)).toHaveValue(
      'Ingeniera',
    );
    expect(window.location.search).toBe('?source=profile');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toEqual(state);
    await user.type(aboutMe, 'Desarrollo software.');
    expect(aboutMe).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it.each(['/profile/settings', '/profile#complete-presentation'])(
    'does not move focus on an ordinary visit to %s',
    (path) => {
      window.history.replaceState(null, '', path);
      render(
        <PresentationForm
          initialValues={{ headline: '', aboutMe: '' }}
          onSubmit={vi.fn()}
        />,
      );
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/Titular profesional/)).not.toHaveFocus();
    },
  );

  it('handles a new hash request on the mounted page and respects reduced motion', () => {
    window.history.replaceState(null, '', '/profile/settings');
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList);
    render(
      <PresentationForm
        initialValues={{ headline: '', aboutMe: '' }}
        onSubmit={vi.fn()}
      />,
    );
    act(() => {
      window.history.replaceState(
        null,
        '',
        '/profile/settings#complete-presentation',
      );
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByLabelText(/Titular profesional/)).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
  });

  it.each([
    {
      path: '/profile#complete-education',
      View: EducationProfileSection,
      field: /Institución/,
    },
    {
      path: '/profile#complete-work-experience',
      View: WorkExperienceProfileSection,
      field: /Empresa/,
    },
    {
      path: '/profile#complete-certifications',
      View: CertificationProfileSection,
      field: /Nombre de la certificación/,
    },
  ])(
    'opens the creation dialog at $path and keeps it closed after cancellation',
    async ({ path, View, field }) => {
      const user = userEvent.setup();
      window.history.replaceState(null, '', path);
      render(
        <StrictMode>
          <View />
        </StrictMode>,
      );
      await screen.findByRole('dialog');
      await waitFor(() => expect(screen.getByLabelText(field)).toHaveFocus());
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
      expect(window.location.hash).toBe('');
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    },
  );

  it('waits for the education catalog before focusing the enabled institution field', async () => {
    const user = userEvent.setup();
    let resolveInstitutions!: (value: typeof institutions) => void;
    vi.mocked(educationsService.getInstitutions).mockReturnValue(
      new Promise((resolve) => {
        resolveInstitutions = resolve;
      }),
    );
    window.history.replaceState(null, '', '/profile#complete-education');
    render(
      <>
        <ProfileCompletenessChecklist
          sections={createProfileCompleteness([]).sections}
        />
        <EducationProfileSection />
      </>,
    );
    await screen.findByRole('dialog');
    expect(screen.getByLabelText(/Institución/)).toBeDisabled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('link', { name: 'Completar Formación académica' }),
    );
    await screen.findByRole('dialog');
    await act(async () => {
      resolveInstitutions(institutions);
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/Institución/)).toHaveFocus(),
    );
    expect(window.location.hash).toBe('');
  });

  it('focuses the skills search after the skills have loaded', async () => {
    window.history.replaceState(null, '', '/profile#complete-skills');
    render(<SkillsProfileSection />);
    await waitFor(() =>
      expect(document.getElementById('skill-picker-query')).toHaveFocus(),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(window.location.hash).toBe('');
  });
});
