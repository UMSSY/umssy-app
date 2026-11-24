vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
import { toast } from 'sonner';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMentorOrientationTypes,
  getOrientationTypes,
  updateMentorOrientationTypes,
} from '../services/orientation-type.service';
import { OrientationConfigView } from './orientation-config-view';
import { getMentorTechnicalAreas } from '@/modules/mentor-participation/services/technical-areas.service';
import { getTechnicalAreas } from '@/modules/mentor-participation/services/technical-area.service';

vi.mock('../services/orientation-type.service', () => ({
  getOrientationTypes: vi.fn(),
  getMentorOrientationTypes: vi.fn(),
  updateMentorOrientationTypes: vi.fn(),
}));
vi.mock(
  '@/modules/mentor-participation/services/technical-areas.service',
  () => ({
    getMentorTechnicalAreas: vi.fn(),
    updateMentorTechnicalAreas: vi.fn(),
  }),
);
vi.mock(
  '@/modules/mentor-participation/services/technical-area.service',
  () => ({
    getTechnicalAreas: vi.fn(),
  }),
);
vi.mock('../hooks/use-current-user-id', () => ({
  useCurrentUserId: () => ({ currentUserId: 'mentor-1' }),
}));
vi.mock('../components/preview/mentor-profile-preview', () => ({
  MentorProfilePreview: ({ onBack }: { onBack: () => void }) => (
    <button type="button" onClick={onBack}>
      Volver a editar
    </button>
  ),
}));
const catalog = [
  {
    id: '0424f370-00f0-43cf-9b8a-997af81840b9',
    name: 'Búsqueda de empleo',
    description: 'Preparación para oportunidades laborales',
  },
  {
    id: '0fa5e6de-63a4-430e-87fb-22f5eb700ecd',
    name: 'Orientación profesional',
    description: null,
  },
  {
    id: 'b679c31a-2545-43a9-91ac-f254b49e7b0c',
    name: 'Orientación técnica',
    description: 'Decisiones y crecimiento técnico',
  },
];

const selectedOrientations = [catalog[0], catalog[2]];
const checkbox = (name: RegExp | string) =>
  screen.getByRole('checkbox', { name, hidden: true });
const expectOrientationStyle = (
  name: string,
  state: 'saved' | 'new' | 'unselected',
) => {
  const input = checkbox(name);
  const card = input.closest('label');

  expect(card).not.toBeNull();
  if (state === 'unselected') {
    expect(input).not.toBeChecked();
    expect(card).toHaveClass('border-transparent', 'bg-surface-soft/50');
    expect(input).toHaveClass('bg-border');
    expect(input).not.toHaveClass('data-checked:bg-ink-soft');
    expect(input).not.toHaveClass('data-checked:bg-accent');
    return;
  }

  expect(input).toBeChecked();
  if (state === 'saved') {
    expect(card).toHaveClass('border-border', 'bg-surface-soft/50');
    expect(input).toHaveClass('data-checked:bg-accent');
  } else {
    expect(card).toHaveClass('border-accent', 'bg-interaction/50');
    expect(input).toHaveClass('data-checked:bg-accent');
  }
};

describe('OrientationConfigView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrientationTypes).mockResolvedValue(catalog);
    vi.mocked(getMentorOrientationTypes).mockResolvedValue(
      selectedOrientations,
    );
    vi.mocked(updateMentorOrientationTypes).mockResolvedValue();
    vi.mocked(getTechnicalAreas).mockResolvedValue([]);
    vi.mocked(getMentorTechnicalAreas).mockResolvedValue([]);
  });

  afterEach(cleanup);

  it('muestra loading mientras carga las consultas', () => {
    vi.mocked(getOrientationTypes).mockReturnValue(new Promise(() => {}));
    vi.mocked(getMentorOrientationTypes).mockReturnValue(new Promise(() => {}));

    render(<OrientationConfigView />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando tu participación como mentor',
    );
  });

  it('carga el catalogo real y precarga los UUID guardados', async () => {
    render(<OrientationConfigView />);

    expect(
      await screen.findByText(catalog[0].description ?? ''),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(catalog.length);
    expect(checkbox('Búsqueda de empleo')).toBeChecked();
    expect(checkbox('Orientación técnica')).toBeChecked();
    expect(checkbox('Orientación profesional')).not.toBeChecked();
    expectOrientationStyle('Búsqueda de empleo', 'saved');
    expectOrientationStyle('Orientación técnica', 'saved');
    expectOrientationStyle('Orientación profesional', 'unselected');
    expect(getOrientationTypes).toHaveBeenCalledTimes(1);
    expect(getMentorOrientationTypes).toHaveBeenCalledTimes(1);
  });

  it('permite agregar y quitar multiples orientaciones', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(checkbox('Orientación técnica'));

    expect(checkbox('Orientación profesional')).toBeChecked();
    expect(checkbox('Orientación técnica')).not.toBeChecked();
    expect(checkbox('Búsqueda de empleo')).toBeChecked();
    expectOrientationStyle('Orientación profesional', 'new');
    expectOrientationStyle('Orientación técnica', 'unselected');
    expectOrientationStyle('Búsqueda de empleo', 'saved');
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
  });

  it('recupera el estilo persistido al volver a seleccionar una orientación guardada', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación técnica' });

    fireEvent.click(checkbox('Orientación técnica'));
    expectOrientationStyle('Orientación técnica', 'unselected');

    fireEvent.click(checkbox('Orientación técnica'));
    expectOrientationStyle('Orientación técnica', 'saved');
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
  });

  it('al guardar sin ninguna orientación muestra el mensaje y no guarda', async () => {
    vi.mocked(getMentorOrientationTypes).mockResolvedValue([catalog[0]]);
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Búsqueda de empleo' });

    fireEvent.click(checkbox('Búsqueda de empleo'));
    const saveButton = screen.getByRole('button', { name: 'Guardar cambios' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    expect(
      screen.getByText('Debe seleccionar al menos una opción'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();

    fireEvent.click(checkbox('Búsqueda de empleo'));
    expect(
      screen.queryByText('Debe seleccionar al menos una opción'),
    ).not.toBeInTheDocument();
  });

  it('guarda exactamente los UUID seleccionados y muestra exito', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(checkbox('Orientación técnica'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      screen.getByRole('heading', { name: '¿Guardar cambios?' }),
    ).toBeInTheDocument();
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(updateMentorOrientationTypes).toHaveBeenCalledWith([
      catalog[0].id,
      catalog[1].id,
    ]);
    expectOrientationStyle('Búsqueda de empleo', 'saved');
    expectOrientationStyle('Orientación profesional', 'saved');
    expectOrientationStyle('Orientación técnica', 'unselected');
  });

  it('permite cancelar la confirmación sin guardar', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Cancelar',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
    expect(checkbox('Orientación profesional')).toBeChecked();
  });

  it('mantiene la selección bloqueada mientras el backend confirma el guardado', async () => {
    let resolveSave!: () => void;
    vi.mocked(updateMentorOrientationTypes).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Guardando...' }),
    ).toBeDisabled();
    expect(checkbox('Orientación profesional')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(checkbox('Orientación profesional'));
    expectOrientationStyle('Orientación profesional', 'new');

    resolveSave();
    await waitFor(() =>
      expectOrientationStyle('Orientación profesional', 'saved'),
    );
  });

  it('muestra el estado guardado de las orientaciones persistidas tras recargar', async () => {
    const { unmount } = render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });
    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );

    unmount();
    vi.mocked(getMentorOrientationTypes).mockResolvedValueOnce(catalog);
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    expectOrientationStyle('Orientación profesional', 'saved');
    expect(getMentorOrientationTypes).toHaveBeenCalledTimes(2);
  });

  it('conserva la seleccion si falla el guardado', async () => {
    vi.mocked(updateMentorOrientationTypes).mockRejectedValueOnce(
      new Error('500'),
    );
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(checkbox('Orientación técnica'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );

    expect(
      await screen.findByText(
        'No se pudieron guardar los cambios. Intente nuevamente.',
      ),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    expectOrientationStyle('Orientación profesional', 'new');
    expectOrientationStyle('Búsqueda de empleo', 'saved');
    expectOrientationStyle('Orientación técnica', 'unselected');
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(updateMentorOrientationTypes).toHaveBeenNthCalledWith(2, [
      catalog[0].id,
      catalog[1].id,
    ]);
    expectOrientationStyle('Orientación profesional', 'saved');
  });

  it('guarda los cambios después de volver de la vista previa', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Vista previa' }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Volver a editar' }),
    );

    expect(
      await screen.findByRole('checkbox', { name: 'Orientación profesional' }),
    ).toBeChecked();
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(updateMentorOrientationTypes).toHaveBeenCalledWith([
      catalog[0].id,
      catalog[2].id,
      catalog[1].id,
    ]);
  });

  it('muestra error de carga y reintenta ambas consultas', async () => {
    vi.mocked(getOrientationTypes)
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      })
      .mockResolvedValueOnce(catalog);
    render(<OrientationConfigView />);

    expect(
      await screen.findByText(
        'No se pudieron cargar los tipos de orientación.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('checkbox', { name: 'Orientación técnica' }),
    ).toBeChecked();
    expect(getOrientationTypes).toHaveBeenCalledTimes(2);
    expect(getMentorOrientationTypes).toHaveBeenCalledTimes(2);
  });

  it('muestra activacion cuando el backend informa que no es mentor activo', async () => {
    vi.mocked(getMentorOrientationTypes).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404 },
    });
    render(<OrientationConfigView />);

    expect(
      await screen.findByText(
        /Primero debes activar tu participación como mentor/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Activar participación como mentor' }),
    ).toHaveAttribute('href', '/mentorship');
  });

  it('no depende de localStorage', async () => {
    const readStorage = vi.spyOn(Storage.prototype, 'getItem');
    const writeStorage = vi.spyOn(Storage.prototype, 'setItem');

    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación técnica' });
    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, guardar cambios' }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(readStorage).not.toHaveBeenCalled();
    expect(writeStorage).not.toHaveBeenCalled();
    readStorage.mockRestore();
    writeStorage.mockRestore();
  });

  it('Cancelar sin cambios regresa directo a Mi participación', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(push).toHaveBeenCalledWith('/mentors/participation');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('Cancelar con cambios pide confirmar y Seguir editando conserva las selecciones', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.getByRole('heading', {
        name: '¿Desea descartar los cambios realizados?',
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
    expect(checkbox('Orientación profesional')).toBeChecked();
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
  });

  it('confirmar el descarte elimina el borrador, navega y no llama al backend', async () => {
    render(<OrientationConfigView />);
    await screen.findByRole('checkbox', { name: 'Orientación profesional' });

    fireEvent.click(checkbox('Orientación profesional'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));

    expect(push).toHaveBeenCalledWith('/mentors/participation');
    await waitFor(() =>
      expect(checkbox('Orientación profesional')).not.toBeChecked(),
    );
    expectOrientationStyle('Búsqueda de empleo', 'saved');
    expect(updateMentorOrientationTypes).not.toHaveBeenCalled();
  });
});
