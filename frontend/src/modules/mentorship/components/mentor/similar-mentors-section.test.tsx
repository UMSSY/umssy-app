import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { act } from '@testing-library/react';
import type { SimilarMentorsSectionProps } from '../../types/similar-mentor.types';
import { SIMILAR_MENTORS_FIXTURE } from '../../testing/similar-mentors.fixture';
import { SimilarMentorsSection } from './similar-mentors-section';

afterEach(cleanup);

describe('SimilarMentorsSection', () => {
  it('conserva textos extensos completos, orden y enlaces sin eliminar las reglas de ajuste', () => {
    const mentors = [...SIMILAR_MENTORS_FIXTURE]
      .reverse()
      .map((mentor, index) => ({
        ...mentor,
        fullName: `${mentor.fullName} ${'ApellidoExtenso'.repeat(8)}`,
        technicalAreas: [
          `Área ${index}: ${'ArquitecturaDeSistemasDistribuidos'.repeat(6)}`,
        ],
        orientationTypes: [
          `Orientación ${index}: ${'AcompañamientoProfesional'.repeat(6)}`,
        ],
      }));
    render(<SimilarMentorsSection status="success" mentors={mentors} />);
    const section = screen.getByRole('region', {
      name: 'También podría interesarte',
    });
    const headings = within(section).getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(
      mentors.map((mentor) => mentor.fullName),
    );
    for (const [index, mentor] of mentors.entries()) {
      const heading = headings[index];
      expect(heading).toHaveClass('[overflow-wrap:anywhere]');
      expect(heading.parentElement).toHaveClass('min-w-0', 'flex-1');
      const card = heading.closest('[data-slot="card"]');
      expect(card).toHaveClass('min-w-0', 'h-full');
      const content = within(card as HTMLElement);
      for (const label of [
        ...mentor.technicalAreas,
        ...mentor.orientationTypes,
      ]) {
        expect(content.getByText(label, { exact: true })).toHaveClass(
          'max-w-full',
          'whitespace-normal',
          '[overflow-wrap:anywhere]',
        );
      }
      expect(
        content.getByText(
          mentor.isAvailable ? 'Disponible para mentoría' : 'No disponible',
        ),
      ).toHaveClass('h-auto', 'max-w-full', 'whitespace-normal');
      const link = content.getByRole('link', {
        name: `Ver perfil de ${mentor.fullName}`,
      });
      expect(link).toHaveAttribute('href', `/mentors/${mentor.id}`);
      expect(link).toHaveClass('min-h-11', 'w-full');
      expect(link).not.toHaveAttribute('tabindex', '-1');
    }
  });

  it('conserva la cuadrícula adaptable también durante la carga', () => {
    render(<SimilarMentorsSection status="loading" />);
    const section = screen.getByRole('region', {
      name: 'También podría interesarte',
    });
    const status = within(section).getByRole('status');
    expect(section).toHaveClass('@container', 'min-w-0', 'w-full');
    expect(status.lastElementChild).toHaveClass(
      'grid',
      'grid-cols-1',
      '@min-[60rem]:grid-cols-3',
      'gap-5',
    );
    for (const skeleton of section.querySelectorAll('[data-slot="skeleton"]')) {
      expect(skeleton).toHaveClass('w-full', 'motion-reduce:animate-none');
    }
    expect(within(section).queryByRole('link')).not.toBeInTheDocument();
  });

  it.each([
    '/mentorship/mentors?area=backend',
    'https://evil.test',
    '//evil.test',
    '/mentorship/mentors-evil',
  ])('conserva únicamente un retorno seguro: %s', (returnTo) => {
    render(
      <SimilarMentorsSection
        status="success"
        mentors={SIMILAR_MENTORS_FIXTURE}
        returnTo={returnTo}
      />,
    );
    const suffix =
      returnTo === '/mentorship/mentors?area=backend'
        ? `?returnTo=${encodeURIComponent(returnTo)}`
        : '';
    for (const mentor of SIMILAR_MENTORS_FIXTURE) {
      expect(
        screen.getByRole('link', { name: `Ver perfil de ${mentor.fullName}` }),
      ).toHaveAttribute('href', `/mentors/${mentor.id}${suffix}`);
    }
  });
  it.each([false, true])(
    'recupera error, carga y resultado vacío=%s',
    async (empty) => {
      const user = userEvent.setup();
      const retry = vi.fn();
      let complete = () => {};
      function ControlledSection() {
        const [state, setState] = useState<SimilarMentorsSectionProps>({
          status: 'error',
          onRetry: () => {
            retry();
            setState({ status: 'loading' });
          },
        });
        complete = () =>
          setState({
            status: 'success',
            mentors: empty ? [] : SIMILAR_MENTORS_FIXTURE,
          });
        return <SimilarMentorsSection {...state} />;
      }
      render(<ControlledSection />);
      const section = screen.getByRole('region', {
        name: 'También podría interesarte',
      });
      expect(within(section).getByRole('alert')).toHaveTextContent(
        'No pudimos cargar los mentores similares',
      );
      expect(
        within(section).queryByRole('heading', { level: 3 }),
      ).not.toBeInTheDocument();
      await user.click(
        within(section).getByRole('button', { name: 'Reintentar' }),
      );
      expect(retry).toHaveBeenCalledTimes(1);
      expect(section).toHaveAttribute('aria-busy', 'true');
      expect(within(section).getByRole('heading', { level: 2 })).toBeVisible();
      expect(within(section).getByRole('status')).toHaveTextContent(
        'Cargando mentores similares...',
      );
      expect(section.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
        3,
      );
      expect(within(section).queryByRole('alert')).not.toBeInTheDocument();
      expect(
        within(section).queryByRole('heading', { level: 3 }),
      ).not.toBeInTheDocument();
      expect(
        within(section).queryByText('No hay mentores similares disponibles'),
      ).not.toBeInTheDocument();
      act(() => complete());
      expect(section).toHaveAttribute('aria-busy', 'false');
      expect(within(section).queryByRole('alert')).not.toBeInTheDocument();
      expect(
        within(section).queryByText('Cargando mentores similares...'),
      ).not.toBeInTheDocument();
      expect(
        within(section).queryByRole('button', { name: 'Reintentar' }),
      ).not.toBeInTheDocument();
      expect(
        within(section).queryAllByRole('heading', { level: 3 }),
      ).toHaveLength(empty ? 0 : 3);
      if (empty)
        expect(within(section).getByRole('status')).toHaveTextContent(
          /^No hay mentores similares disponibles$/,
        );
    },
  );

  it('representa el estado vacío explícito', () => {
    render(<SimilarMentorsSection status="empty" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      /^No hay mentores similares disponibles$/,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra tres mentores con todo el contenido y ambos estados de disponibilidad', () => {
    render(
      <SimilarMentorsSection
        status="success"
        mentors={SIMILAR_MENTORS_FIXTURE}
      />,
    );
    const section = screen.getByRole('region', {
      name: 'También podría interesarte',
    });
    expect(
      within(section).getByRole('heading', { level: 2 }),
    ).toHaveTextContent('También podría interesarte');
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(
      3,
    );

    for (const [index, mentor] of SIMILAR_MENTORS_FIXTURE.entries()) {
      const heading = within(section).getByRole('heading', {
        name: mentor.fullName,
      });
      const card = heading.closest('[data-slot="card"]');
      expect(card).not.toBeNull();
      const content = within(card as HTMLElement);
      expect(content.getByText(['LF', 'DR', 'VG'][index])).toBeInTheDocument();
      expect(content.getByText('Mentor')).toBeInTheDocument();
      expect(content.getByText('Áreas técnicas')).toBeInTheDocument();
      expect(content.getByText('Tipos de orientación')).toBeInTheDocument();
      for (const label of [
        ...mentor.technicalAreas,
        ...mentor.orientationTypes,
      ]) {
        expect(content.getByText(label)).toBeInTheDocument();
      }
      expect(
        content.getByText(
          mentor.isAvailable ? 'Disponible para mentoría' : 'No disponible',
        ),
      ).toBeInTheDocument();
      expect(
        content.getByRole('link', {
          name: `Ver perfil de ${mentor.fullName}`,
        }),
      ).toHaveAttribute('href', `/mentors/${mentor.id}`);
    }
    expect(
      within(section)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(SIMILAR_MENTORS_FIXTURE.map((mentor) => mentor.fullName));
  });

  it('limita la maqueta a tres tarjetas aunque se agreguen más fixtures', () => {
    SIMILAR_MENTORS_FIXTURE.push({
      ...SIMILAR_MENTORS_FIXTURE[0],
      id: 'demo-extra-mentor',
      fullName: 'Mentor adicional',
    });
    try {
      render(
        <SimilarMentorsSection
          status="success"
          mentors={SIMILAR_MENTORS_FIXTURE}
        />,
      );
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      expect(screen.queryByText('Mentor adicional')).not.toBeInTheDocument();
    } finally {
      SIMILAR_MENTORS_FIXTURE.pop();
    }
  });

  it('define una columna en móvil y tres cuando el contenedor tiene espacio', () => {
    render(
      <SimilarMentorsSection
        status="success"
        mentors={SIMILAR_MENTORS_FIXTURE}
      />,
    );
    const section = screen.getByRole('region');
    expect(section).toHaveClass('@container', 'min-w-0', 'w-full');
    expect(section.lastElementChild).toHaveClass(
      'grid-cols-1',
      '@min-[60rem]:grid-cols-3',
      'gap-5',
    );
    for (const heading of screen.getAllByRole('heading', { level: 3 })) {
      expect(heading).toHaveClass('[overflow-wrap:anywhere]');
      expect(heading.closest('[data-slot="card"]')).toHaveClass(
        'min-w-0',
        'h-full',
      );
    }
    for (const mentor of SIMILAR_MENTORS_FIXTURE) {
      for (const label of [
        ...mentor.technicalAreas,
        ...mentor.orientationTypes,
      ]) {
        expect(screen.getByText(label)).toHaveClass(
          'max-w-full',
          'whitespace-normal',
          '[overflow-wrap:anywhere]',
        );
      }
    }
    for (const button of screen.getAllByRole('link')) {
      expect(button).toHaveClass('min-h-11', 'w-full');
    }
  });
});
