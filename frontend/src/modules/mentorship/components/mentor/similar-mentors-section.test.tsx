import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SIMILAR_MENTORS_FIXTURE } from '../../testing/similar-mentors.fixture';
import { SimilarMentorsSection } from './similar-mentors-section';

afterEach(cleanup);

describe('SimilarMentorsSection', () => {
  it('muestra tres mentores con todo el contenido y ambos estados de disponibilidad', () => {
    render(<SimilarMentorsSection />);
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
      expect(content.getByText(mentor.roleLabel)).toBeInTheDocument();
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
        content.getByRole('button', {
          name: `Ver perfil de ${mentor.fullName}`,
        }),
      ).toBeDisabled();
    }
    expect(within(section).queryByRole('link')).not.toBeInTheDocument();
  });

  it('limita la maqueta a tres tarjetas aunque se agreguen más fixtures', () => {
    SIMILAR_MENTORS_FIXTURE.push({
      ...SIMILAR_MENTORS_FIXTURE[0],
      id: 'demo-extra-mentor',
      fullName: 'Mentor adicional',
    });
    try {
      render(<SimilarMentorsSection />);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      expect(screen.queryByText('Mentor adicional')).not.toBeInTheDocument();
    } finally {
      SIMILAR_MENTORS_FIXTURE.pop();
    }
  });

  it('define una columna en móvil y tres cuando el contenedor tiene espacio', () => {
    render(<SimilarMentorsSection />);
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
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveClass('min-h-11', 'w-full');
    }
  });
});
