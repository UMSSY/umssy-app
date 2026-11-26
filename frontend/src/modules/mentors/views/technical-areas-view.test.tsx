vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMentorTechnicalAreas,
  updateMentorTechnicalAreas,
} from '@/modules/mentor-participation/services/technical-areas.service';
import { TechnicalAreasView } from './technical-areas-view';
import { getTechnicalAreas } from '@/modules/mentor-participation/services/technical-area.service';
import {
  getMentorOrientationTypes,
  getOrientationTypes,
} from '@/modules/mentorship/services/orientation-type.service';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
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

vi.mock('@/modules/mentorship/services/orientation-type.service', () => ({
  getOrientationTypes: vi.fn(),
  getMentorOrientationTypes: vi.fn(),
  updateMentorOrientationTypes: vi.fn(),
}));
vi.mock('@/modules/mentorship/hooks/use-current-user-id', () => ({
  useCurrentUserId: () => ({ currentUserId: 'mentor-1' }),
}));
vi.mock(
  '@/modules/mentorship/components/preview/mentor-profile-preview',
  () => ({
    MentorProfilePreview: ({ onBack }: { onBack: () => void }) => (
      <button type="button" onClick={onBack}>
        Volver a editar
      </button>
    ),
  }),
);

const catalog = [
  {
    id: '0424f370-00f0-43cf-9b8a-997af81840b9',
    name: 'Backend',
    description: 'APIs y lógica de negocio',
  },
  {
    id: '0fa5e6de-63a4-430e-87fb-22f5eb700ecd',
    name: 'QA',
    description: 'Testing y calidad',
  },
  {
    id: 'b679c31a-2545-43a9-91ac-f254b49e7b0c',
    name: 'Cloud',
    description: null,
  },
];

const selectedAreas = [catalog[0], catalog[2]];
const card = (name: RegExp) => screen.getByRole('checkbox', { name });
const button = (name: RegExp | string) => screen.getByRole('button', { name });

describe('TechnicalAreasView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTechnicalAreas).mockResolvedValue(catalog);
    vi.mocked(getMentorTechnicalAreas).mockResolvedValue(selectedAreas);
    vi.mocked(updateMentorTechnicalAreas).mockResolvedValue();
    vi.mocked(getOrientationTypes).mockResolvedValue([]);
    vi.mocked(getMentorOrientationTypes).mockResolvedValue([]);
  });

  afterEach(cleanup);

  it('muestra carga y precarga la seleccion persistida', async () => {
    render(<TechnicalAreasView />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando áreas técnicas',
    );
    expect(await screen.findByText('2 seleccionadas')).toBeInTheDocument();
    expect(card(/Backend/)).toHaveAttribute('aria-checked', 'true');
    expect(card(/Cloud/)).toHaveAttribute('aria-checked', 'true');
    expect(card(/QA/)).toHaveAttribute('aria-checked', 'false');
  });

  it('desmarcar todo y presionar Guardar muestra el mensaje sin guardar', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/Backend/));
    fireEvent.click(card(/Cloud/));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(button(/Guardar cambios/)).toBeEnabled();
    fireEvent.click(button(/Guardar cambios/));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Debe seleccionar al menos una opción',
    );
    expect(updateMentorTechnicalAreas).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();

    fireEvent.click(card(/QA/));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('guarda UUID reales y muestra el mensaje de exito', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/QA/));
    fireEvent.click(button(/Guardar cambios/));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(updateMentorTechnicalAreas).toHaveBeenCalledWith([
      catalog[0].id,
      catalog[2].id,
      catalog[1].id,
    ]);
  });

  it('si falla el guardado conserva la seleccion actual', async () => {
    vi.mocked(updateMentorTechnicalAreas).mockRejectedValueOnce(
      new Error('500'),
    );
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/QA/));
    fireEvent.click(button(/Guardar cambios/));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No se pudieron guardar los cambios. Intente nuevamente.',
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(card(/QA/)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('3 seleccionadas')).toBeInTheDocument();
  });
  it('guarda los cambios después de volver de la vista previa', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/QA/));
    await waitFor(() => expect(button('Vista previa')).toBeEnabled());
    fireEvent.click(button('Vista previa'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Volver a editar' }),
    );

    expect(await screen.findByText('3 seleccionadas')).toBeInTheDocument();
    expect(updateMentorTechnicalAreas).not.toHaveBeenCalled();

    fireEvent.click(button(/Guardar cambios/));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Se guardaron los cambios con éxito',
      ),
    );
    expect(updateMentorTechnicalAreas).toHaveBeenCalledWith([
      catalog[0].id,
      catalog[2].id,
      catalog[1].id,
    ]);
  });
  it('muestra error de carga y permite reintentar', async () => {
    vi.mocked(getTechnicalAreas)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(catalog);
    render(<TechnicalAreasView />);

    expect(
      await screen.findByText('No se pudieron cargar las áreas técnicas.'),
    ).toBeInTheDocument();
    fireEvent.click(button('Reintentar'));

    expect(await screen.findByText('2 seleccionadas')).toBeInTheDocument();
    expect(getTechnicalAreas).toHaveBeenCalledTimes(2);
    expect(getMentorTechnicalAreas).toHaveBeenCalledTimes(2);
  });

  it('deriva al flujo de participación sin reintento ni guardado ante 403', async () => {
    vi.mocked(getMentorTechnicalAreas).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403 },
    });
    render(<TechnicalAreasView />);
    expect(
      await screen.findByText(
        'Necesitas una participación activa como mentor para editar áreas técnicas.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Iniciar incorporación' }),
    ).toHaveAttribute('href', '/mentorship');
    expect(
      screen.queryByRole('button', { name: 'Reintentar' }),
    ).not.toBeInTheDocument();
    expect(button(/Guardar cambios/)).toBeDisabled();
    expect(updateMentorTechnicalAreas).not.toHaveBeenCalled();
  });

  it('Cancelar sin cambios regresa directo a Mi participación', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(button('Cancelar'));

    expect(push).toHaveBeenCalledWith('/mentors/participation');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('Cancelar con cambios pide confirmar y Seguir editando conserva las selecciones', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/QA/));
    fireEvent.click(button('Cancelar'));
    expect(
      screen.getByText('¿Desea descartar los cambios realizados?'),
    ).toBeInTheDocument();

    fireEvent.click(button('Seguir editando'));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
    expect(card(/QA/)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('3 seleccionadas')).toBeInTheDocument();
  });

  it('confirmar el descarte elimina el borrador, navega y no llama al backend', async () => {
    render(<TechnicalAreasView />);
    await screen.findByText('2 seleccionadas');

    fireEvent.click(card(/QA/));
    fireEvent.click(button('Cancelar'));
    await act(async () => fireEvent.click(button('Descartar cambios')));

    expect(push).toHaveBeenCalledWith('/mentors/participation');
    await waitFor(() =>
      expect(card(/QA/)).toHaveAttribute('aria-checked', 'false'),
    );
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
    expect(updateMentorTechnicalAreas).not.toHaveBeenCalled();
  });
});
