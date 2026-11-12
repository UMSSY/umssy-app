import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { createProfileCompleteness } from '../testing/profile-completeness.fixture';
import type { ProfileCompletenessSection } from '../types/profile-completeness-section.types';
import { ProfileCompletenessChecklist } from './profile-completeness-checklist';

const { sections } = createProfileCompleteness(['contact']);

afterEach(cleanup);

function renderChecklist(data?: readonly ProfileCompletenessSection[] | null) {
  render(<ProfileCompletenessChecklist sections={data} />);
  return within(screen.getByRole('region', { name: 'Secciones del perfil' }));
}

describe('ProfileCompletenessChecklist', () => {
  it('renders all six sections in a stable order with their saved status', () => {
    const panel = renderChecklist([...sections].reverse());
    expect(
      panel
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual([
      'Datos de contacto: Completada',
      'Presentación: Pendiente',
      'Formación académica: Pendiente',
      'Experiencia laboral: Pendiente',
      'Habilidades: Pendiente',
      'Certificaciones: Pendiente',
    ]);
    expect(panel.getAllByText('Completada')).toHaveLength(1);
    expect(panel.getAllByText('Pendiente')).toHaveLength(5);
    expect(panel.getByText('1 de 6 secciones completadas')).toBeVisible();
  });

  it.each([
    { completed: [], status: 'Pendiente', count: 0 },
    {
      completed: PROFILE_COMPLETENESS_SECTION_IDS,
      status: 'Completada',
      count: 6,
    },
  ])('shows $count completed sections', ({ completed, status, count }) => {
    const panel = renderChecklist(
      createProfileCompleteness(completed).sections,
    );
    expect(panel.getAllByText(status)).toHaveLength(6);
    expect(
      panel.getByText(`${count} de 6 secciones completadas`),
    ).toBeVisible();
  });

  it('does not let clicking a section change its saved status', async () => {
    const user = userEvent.setup();
    const panel = renderChecklist(sections);
    const item = panel.getByRole('listitem', {
      name: 'Habilidades: Pendiente',
    });
    await user.click(item);
    expect(item).toHaveTextContent('Pendiente');
    expect(panel.getByText('1 de 6 secciones completadas')).toBeVisible();
    expect(panel.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it.each([
    { name: 'undefined', data: undefined },
    { name: 'null', data: null },
    { name: 'empty', data: [] },
    { name: 'incomplete', data: sections.slice(0, 2) },
  ])('does not invent pending statuses for $name data', ({ data }) => {
    const panel = renderChecklist(data);
    expect(
      panel.getByText('No se pudo obtener el estado de las secciones.'),
    ).toBeVisible();
    expect(panel.queryByRole('list')).not.toBeInTheDocument();
    expect(panel.queryByText('Pendiente')).not.toBeInTheDocument();
  });
});
