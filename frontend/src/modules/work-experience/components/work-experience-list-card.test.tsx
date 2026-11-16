import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { WorkExperienceListCard } from './work-experience-list-card';

const LONG_POSITION = 'a'.repeat(1200);

const EXPERIENCE: WorkExperienceItem = {
  id: 'experience-1',
  companyName: 'Banco',
  position: LONG_POSITION,
  startDate: '2020-02-01',
  endDate: '2023-07-01',
  isCurrent: false,
  description: null,
};

function createExperience(
  id: string,
  position: string,
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
  companyName = 'Banco',
): WorkExperienceItem {
  return {
    id,
    companyName,
    position,
    startDate,
    endDate,
    isCurrent,
    description: null,
  };
}

describe('WorkExperienceListCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('wraps a long position inside the card and keeps its actions available', () => {
    render(<WorkExperienceListCard experiences={[EXPERIENCE]} />);

    const heading = screen.getByRole('heading', {
      level: 4,
      name: LONG_POSITION,
    });

    expect(heading).toHaveClass('wrap-anywhere');
    expect(heading.parentElement).toHaveClass('min-w-0', 'flex-1');
    expect(
      screen.getByRole('button', { name: `Editar ${LONG_POSITION}` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Eliminar ${LONG_POSITION}` }),
    ).toBeInTheDocument();
  });

  it('uses a level-three heading for the company and level-four headings for positions', () => {
    const experiences = [
      createExperience(
        'senior',
        'Desarrollador Senior',
        '2024-01-01',
        null,
        true,
      ),
      createExperience(
        'junior',
        'Desarrollador Junior',
        '2020-01-01',
        '2022-12-31',
        false,
      ),
    ];

    render(<WorkExperienceListCard experiences={experiences} />);

    expect(
      screen.getByRole('heading', { level: 3, name: /Banco/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Desarrollador Senior',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Desarrollador Junior',
      }),
    ).toBeInTheDocument();
  });

  it('expands and collapses a company group and updates aria-expanded', async () => {
    const user = userEvent.setup();
    const experiences = [
      createExperience('senior', 'Desarrollador Senior', '2024-01-01', null, true),
      createExperience('junior', 'Desarrollador Junior', '2020-01-01', '2022-12-31', false),
    ];

    render(<WorkExperienceListCard experiences={experiences} />);

    const companyButton = screen.getByRole('button', {
      name: /Banco/,
    });

    expect(companyButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('heading', { level: 4, name: 'Desarrollador Junior' }),
    ).toBeInTheDocument();

    await user.click(companyButton);

    expect(companyButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('heading', { level: 4, name: 'Desarrollador Junior' }),
    ).not.toBeInTheDocument();

    await user.click(companyButton);

    expect(companyButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('heading', { level: 4, name: 'Desarrollador Junior' }),
    ).toBeInTheDocument();
  });

  it('does not offer to collapse a company with a single position and always shows it', () => {
    render(<WorkExperienceListCard experiences={[EXPERIENCE]} />);

    expect(
      screen.getByRole('heading', { level: 3, name: /Banco/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Banco/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 4, name: LONG_POSITION }),
    ).toBeVisible();
  });

  it('identifies the first recorded position and current status for multiple positions', () => {
    const experiences = [
      createExperience(
        'current',
        'Desarrollador Actual',
        '2024-01-01',
        null,
        true,
      ),
      createExperience(
        'previous',
        'Analista',
        '2016-10-01',
        '2019-05-01',
        false,
      ),
    ];

    render(<WorkExperienceListCard experiences={experiences} />);

    expect(
      screen.getByText(
        /Primer cargo: Oct 2016 · Tiene un cargo actual/,
      ),
    ).toBeInTheDocument();
  });

  it('treats a position without an end date as current in the company summary', () => {
    const experiences = [
      createExperience(
        'current-without-flag',
        'Coordinador',
        '2024-01-01',
        null,
        false,
      ),
      createExperience(
        'previous',
        'Analista',
        '2020-01-01',
        '2022-12-31',
        false,
      ),
    ];

    render(<WorkExperienceListCard experiences={experiences} />);

    expect(
      screen.getByText(
        /Primer cargo: Ene 2020 · Tiene un cargo actual/,
      ),
    ).toBeInTheDocument();
  });

  it('identifies the first and last recorded positions without implying continuity', () => {
    const experiences = [
      createExperience(
        'last',
        'Gerente',
        '2022-02-01',
        '2023-07-01',
        false,
      ),
      createExperience(
        'first',
        'Analista',
        '2016-10-01',
        '2019-05-01',
        false,
      ),
    ];

    render(<WorkExperienceListCard experiences={experiences} />);

    expect(
      screen.getByText(
        /Primer cargo: Oct 2016 · Último cargo: Jul 2023/,
      ),
    ).toBeInTheDocument();
  });

  it('does not repeat the company period when there is only one position', () => {
    render(<WorkExperienceListCard experiences={[EXPERIENCE]} />);

    const companyHeading = screen.getByRole('heading', {
      level: 3,
      name: /Banco/,
    });

    expect(companyHeading).toHaveTextContent('1 cargo');
    expect(companyHeading).not.toHaveTextContent('Primer cargo');
    expect(companyHeading).not.toHaveTextContent('Tiene un cargo actual');

    expect(
      screen.getByText(/Feb.*2020.*Jul.*2023/),
    ).toBeInTheDocument();
  });
});
