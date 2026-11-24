import '@/shared/testing/indexed-db.mock';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { cloneElement, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '@/app/(app)/layout';
import { stubMatchMedia } from '@/shared/testing/stub-match-media';
import { mapPublishedRadar } from '../mappers/radar-published.mapper';
import { useLiveRadar } from '../hooks/use-live-radar';
import { RADAR_AXIS_NAMES } from '../constants/radar-axis-names.constants';
import { profileSkillsRadarService } from '@/modules/profile';
import { RadarProfileView } from './radar-profile-view';

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/profile/radar',
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('@/modules/auth', async (importOriginal) => {
  const originalModule =
    await importOriginal<typeof import('@/modules/auth')>();
  return { ...originalModule, SessionUserCard: () => null };
});
vi.mock('@/modules/mentorship/services/mentor-directory.service', () => ({
  getMentorDirectory: vi.fn().mockResolvedValue({
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 1,
    pageSize: 6,
    effectiveSort: 'default',
  }),
}));
vi.mock('@/modules/skills/services/skills.service', () => ({
  skillsService: { getCatalog: vi.fn().mockResolvedValue([
    { id: 'jest', name: 'Jest', areaId: 'qa', radarPoints: 1, radarHighRelevancePoints: 1.5 },
  ]) },
}));
vi.mock('../hooks/use-live-radar', () => ({ useLiveRadar: vi.fn() }));
vi.mock('recharts', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('recharts')>();
  return {
    ...originalModule,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width: number; height: number }>;
    }) => cloneElement(children, { width: 600, height: 440 }),
  };
});

const source = {
  userId: 'person-1',
  status: 'ready' as const,
  version: 1,
  updatedAt: '2026-10-25T08:00:00Z',
  dictionaryVersion: '1',
  skills: [],
};

vi.spyOn(profileSkillsRadarService, 'getSkills').mockResolvedValue(source);

const mockHook = vi.mocked(useLiveRadar);
function setRadar(override: Partial<ReturnType<typeof useLiveRadar>> = {}) {
  mockHook.mockReturnValue({
    data: mapPublishedRadar({
      userId: source.userId,
      status: 'published',
      version: source.version,
      updatedAt: source.updatedAt,
      dictionaryVersion: source.dictionaryVersion,
      rubricVersion: 'servidor-v1',
      scores: {
        desarrollo: 0,
        'cloud-devops': 0,
        'data-ai': 0,
        qa: 0,
        ciberseguridad: 0,
        'gobernanza-ti': 0,
      },
      average: 0,
      variation: null,
      pending: 0,
      hasPending: false,
      evidence: {},
      sourceRevision: 1,
      inputRevision: 1,
      processingStatus: 'ready',
      skills: [],
    }),
    loading: false,
    error: null,
    variation: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
    retrying: false,
    previous: null,
    ...override,
  });
}

describe('Radar personal integrado con Épica 2', () => {
  beforeEach(() => {
    stubMatchMedia();
    setRadar();
    window.history.replaceState(null, '', '/profile/radar');
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it.each([
    [0, 0, 'Sin cambio', 'font-semibold'],
    [2, 0, 'Bajó 2 puntos', 'text-destructive'],
    [0, 2, 'Subió 2 puntos', 'text-success'],
  ])(
    'compara el eje con diferencia %s',
    (previousScore, currentScore, label, colorClass) => {
      const data = mockHook().data!;
      setRadar({
        data: {
          ...data,
          version: 2,
          processingStatus: 'pending',
          areas: data.areas.map((area) => ({
            ...area,
            score: area.id === 'qa' ? currentScore : area.score,
          })),
        },
        previous: {
          version: 1,
          updatedAt: '2026-10-20T08:00:00Z',
          scores: {
            desarrollo: 0,
            'cloud-devops': 0,
            'data-ai': 0,
            qa: previousScore,
            ciberseguridad: 0,
            'gobernanza-ti': 0,
          },
        },
      });
      const view = renderWithQuery(<RadarProfileView />);
      let toggle = screen.getByRole('switch', {
        name: 'Comparar con la anterior',
      });
      expect(toggle).not.toBeChecked();
      expect(
        screen.queryByRole('table', { name: 'Cambios por eje' }),
      ).not.toBeInTheDocument();
      expect(document.querySelectorAll('.recharts-radar')).toHaveLength(1);
      fireEvent.click(toggle);
      expect(toggle).toBeChecked();
      view.unmount();
      renderWithQuery(<RadarProfileView />);
      toggle = screen.getByRole('switch', { name: 'Comparar con la anterior' });
      expect(toggle).toBeChecked();
      expect(document.querySelectorAll('.recharts-radar')).toHaveLength(2);
      expect(
        screen.getByRole('heading', { name: 'Detalle de los cambios' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('table', { name: 'Cambios por eje' }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'QA' }));
      expect(screen.getByText(label)).toHaveClass(colorClass);
      expect(
        screen
          .getByRole('button', { name: 'Ver detalle de QA' })
          .querySelector('text'),
      ).toHaveClass('fill-accent', 'underline');
      expect(
        screen.getByTestId('radar-dot-qa').querySelector('.stroke-accent'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Puntaje anterior: ${previousScore} / 10`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Puntaje actual: ${currentScore} / 10`),
      ).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: 'Ver detalle de QA' }),
      );
      expect(screen.getByRole('button', { name: 'QA' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(
        screen.getByText(/Anterior \(línea discontinua\)/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Hay un recálculo pendiente/),
      ).toBeInTheDocument();
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();
      expect(document.querySelectorAll('.recharts-radar')).toHaveLength(1);
      expect(screen.queryByText(label)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('table', { name: 'Cambios por eje' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'Comparación de publicaciones' }),
      ).not.toBeInTheDocument();
    },
  );

  it('avisa que la comparación estará disponible tras la próxima publicación', () => {
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByText(/Tienes una publicación/)).toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: 'Comparar con la anterior' }),
    ).not.toBeInTheDocument();
  });

  it('muestra el estado sin publicaciones', () => {
    const data = mockHook().data!;
    setRadar({ data: { ...data, version: 0 } });
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByText(/Tu radar está sin datos/)).toBeInTheDocument();
    expect(screen.queryByTestId('radar-dot-qa')).not.toBeInTheDocument();
  });

  it.each(RADAR_AXIS_NAMES)("selecciona $name desde el radar y el desglose aun con cero puntos", axis => {
    renderWithQuery(<RadarProfileView />);
    fireEvent.click(screen.getByRole("button", { name: `Ver detalle de ${axis.name}` }));
    const dialog = screen.getByRole("dialog", { name: axis.name });
    expect(within(dialog).getByRole("link", { name: "Ver mentores de esta área" })).toHaveAttribute("href", `/mentorship/mentors?radarArea=${axis.id}`);
    fireEvent.click(screen.getByRole("button", { name: /Cerrar detalle del/ }));
    fireEvent.click(screen.getByRole("button", { name: `Seleccionar ${axis.name}` }));
    expect(screen.getByRole("region", { name: "Competencia seleccionada" })).toHaveTextContent(axis.name);
    fireEvent.click(screen.getByRole("button", { name: "Simular una habilidad" }));
    expect(screen.getByRole("dialog", { name: "Proyecta una habilidad" })).toBeInTheDocument();
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent("0");
  });

  it('muestra seis ejes en cero sin inventar datos ni mezclar perfiles', () => {
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByText('Mi perfil profesional')).toBeInTheDocument();
    expect(
      screen.queryByText(/Rúbrica|Versión del radar|Identificador/),
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('servidor-v1');
    expect(
      screen.getByText(/Todavía no tienes habilidades aprobadas/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('radar-dot-qa')).toBeInTheDocument();
    expect(screen.getByTestId('radar-dot-data-ai')).toBeInTheDocument();
  });

  it('conecta un área con cero puntos al directorio y permite simularla', () => {
    renderWithQuery(<RadarProfileView />);
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar QA' }));
    expect(
      screen.getByRole('link', { name: 'Ver mentores de esta área' }),
    ).toHaveAttribute('href', '/mentorship/mentors?radarArea=qa');
    expect(
      screen.queryByRole('heading', {
        name: 'Proyecci\u00f3n con mentor\u00eda',
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Proyección con mentoría' }));
    expect(
      screen.getByRole('heading', {
        name: 'Disponibilidad de mentor\u00eda',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent("0");
  });

  it('muestra el desglose al inicio y lo restaura al pulsar fuera del panel', () => {
    renderWithQuery(<RadarProfileView />);
    expect(
      screen.queryByRole('heading', {
        name: 'Proyecci\u00f3n con mentor\u00eda',
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar QA' }));
    const simulate = screen.getByRole('button', { name: 'Proyección con mentoría' });
    fireEvent.pointerDown(simulate);
    expect(simulate).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar QA' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar QA' }),
    ).toHaveAttribute('aria-pressed', 'true');
    const breakdown = screen
      .getByRole('heading', { name: /Desglose por/ })
      .closest('aside')!;
    expect(
      simulate.compareDocumentPosition(breakdown) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(breakdown).not.toHaveAttribute('aria-hidden');
    fireEvent.pointerDown(
      screen.getByRole('heading', { name: 'Radar de afinidad' }),
    );
    expect(
      screen.queryByRole('heading', {
        name: 'Proyecci\u00f3n con mentor\u00eda',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar QA' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar QA' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.getByRole('button', { name: 'Seleccionar QA' }),
    ).toBeInTheDocument();
  });

  it('abre la simulacion en un popup y conserva el area al interactuar y cerrar', async () => {
    renderWithQuery(<RadarProfileView />);
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar QA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Proyección con mentoría' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Proyecta una habilidad',
    });
    await screen.findByRole('option', { name: 'Jest' });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'jest' } });
    await waitFor(() => expect(screen.getByText(/l\u00ednea verde discontinua/)).toBeInTheDocument());
    fireEvent.pointerDown(dialog);
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/l\u00ednea verde discontinua/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Seleccionar QA' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Proyección con mentoría' }),
    ).toBeInTheDocument();
  });

  it('abre el detalle del eje seleccionado y permite cerrarlo', () => {
    renderWithQuery(<RadarProfileView />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de QA' }));
    expect(screen.getByRole('dialog', { name: 'QA' })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar detalle del área' }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'QA' }),
    ).not.toBeInTheDocument();
  });

  it('muestra error y reintento sin representar un fallo como cero competencias', () => {
    setRadar({ data: null, error: 'Error de conexión' });
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error de conexión');
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('radar-dot-qa')).not.toBeInTheDocument();
  });

  it('mantiene una sola navegación dentro del layout de la aplicación', async () => {
    await saveAccessToken(
      `h.${btoa(JSON.stringify({ roleTag: 'titulado' }))}.s`,
    );
    renderWithQuery(
      <AppLayout>
        <RadarProfileView />
      </AppLayout>,
    );
    expect(
      await screen.findAllByRole('navigation', { name: 'Menú principal' }),
    ).toHaveLength(1);
  });

  it('consulta la publicacion enlazada desde la bandeja central', async () => {
    const historical = {
      compare: true,
      radar: {
        userId: 'person-1',
        status: 'published',
        version: 2,
        rubricVersion: 'servidor-v1',
        updatedAt: '2026-11-14T18:00:00Z',
        scores: {
          desarrollo: 0,
          'cloud-devops': 0,
          'data-ai': 0,
          qa: 7,
          ciberseguridad: 0,
          'gobernanza-ti': 0,
        },
        average: 7,
        variation: 7,
        pending: 0,
        hasPending: false,
        evidence: {},
        sourceRevision: 2,
        inputRevision: 2,
        processingStatus: 'ready' as const,
        dictionaryVersion: null,
        previous: {
          version: 1,
          updatedAt: '2026-10-25T08:00:00Z',
          scores: {
            desarrollo: 0,
            'cloud-devops': 0,
            'data-ai': 0,
            qa: 0,
            ciberseguridad: 0,
            'gobernanza-ti': 0,
          },
        },
        skills: [],
      },
    };
    vi.spyOn(radarIntegrationApi, 'historical').mockResolvedValue(
      historical.radar,
    );
    window.history.replaceState(null, '', '/profile/radar?snapshot=snapshot-2');

    renderWithQuery(<RadarProfileView />);

    expect(
      await screen.findByText('Consultando la versión histórica 2'),
    ).toBeInTheDocument();

    expect(radarIntegrationApi.historical).toHaveBeenCalledWith('snapshot-2');
    expect(screen.getByText('7 / 10')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Volver al radar actual' }),
    );

    expect(
      screen.queryByText('Consultando la versión histórica 2'),
    ).not.toBeInTheDocument();
  });
  it('despliega el bottom sheet en móvil al tocar un área y restaura el scroll al cerrar', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const scrollToSpy = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { value: 320, writable: true });

    renderWithQuery(<RadarProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar QA' }));

    const dialog = await screen.findByRole('dialog', { name: 'QA' });
    expect(dialog).toBeInTheDocument();
    expect(
      await screen.findByText('Sin información registrada'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar detalle del área' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'QA' }),
      ).not.toBeInTheDocument(),
    );
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 320,
      behavior: 'instant',
    });
  });
});
