import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MentorFreeBlocksView } from "./mentor-free-blocks-view";
import { useMentorFreeBlocks } from "../hooks/use-mentor-free-blocks";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { WeekGridDensity } from "../types/week-grid-density.types";

vi.mock("../hooks/use-mentor-free-blocks");
vi.mock("../components/block-selection/block-selection", () => ({
  BlockSelection: (props: { blocks: AvailabilityBlock[]; density?: WeekGridDensity; onActivityChange?: (active: boolean) => void }) => (
    <div data-testid="block-selection" data-blocks={props.blocks.length} data-density={props.density}>
      <button onClick={() => props.onActivityChange?.(true)}>Seleccionar horario</button>
      <button onClick={() => props.onActivityChange?.(false)}>Descartar borrador</button>
    </div>
  ),
}));
vi.mock("../components/availability-loading", () => ({
  AvailabilityLoading: () => <div data-testid="loading" />,
}));

const mockedUseMentorFreeBlocks = vi.mocked(useMentorFreeBlocks);

const freeBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2026-10-06T22:00:00.000Z",
  endAt: "2026-10-06T23:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
};

describe("MentorFreeBlocksView", () => {
  beforeEach(() => {
    mockedUseMentorFreeBlocks.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("muestra el loading mientras carga", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [], isLoading: true, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("muestra el error si falla la carga", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({
      blocks: [],
      isLoading: false,
      error: "Error al obtener los bloques de disponibilidad",
    });
    render(<MentorFreeBlocksView mentorId="m1" />);
    expect(screen.getByText("Error al obtener los bloques de disponibilidad")).toBeInTheDocument();
  });

  it("muestra el estado vacío con el botón para ir a la semana siguiente", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);
    expect(
      screen.getByText("Este mentor no tiene horarios libres esta semana.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver semana siguiente" })).toBeInTheDocument();
    expect(screen.queryByTestId("block-selection")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Disponibilidad semanal" })).not.toBeInTheDocument();
  });

  it("mantiene el panel montado cuando la actualización deja la semana sin horarios", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    const { rerender } = render(<MentorFreeBlocksView mentorId="m1" />);
    const panel = screen.getByTestId("block-selection");
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar horario" }));
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [], isLoading: false, error: null });
    rerender(<MentorFreeBlocksView mentorId="m1" />);
    expect(screen.getByTestId("block-selection")).toBe(panel);
    expect(panel).toHaveAttribute("data-blocks", "0");
    expect(screen.queryByText("Este mentor no tiene horarios libres esta semana.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
    expect(screen.queryByTestId("block-selection")).not.toBeInTheDocument();
    expect(screen.getByText("Este mentor no tiene horarios libres esta semana.")).toBeInTheDocument();
  });

  it("retira la grilla al vaciarse la semana si no hay selección ni borrador", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    const { rerender } = render(<MentorFreeBlocksView mentorId="m1" />);
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [], isLoading: false, error: null });
    rerender(<MentorFreeBlocksView mentorId="m1" />);
    expect(screen.queryByTestId("block-selection")).not.toBeInTheDocument();
    expect(screen.getByText("Este mentor no tiene horarios libres esta semana.")).toBeInTheDocument();
  });

  it("muestra el encabezado y la semana actual en hora de Bolivia", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-07T15:00:00.000Z") });
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    expect(screen.getByRole("link", { name: "Volver al perfil del mentor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agendar mentoría" })).toBeInTheDocument();
    expect(screen.getByText("5 – 11 de octubre de 2026")).toBeInTheDocument();
    expect(screen.queryByText("Hora de Bolivia (GMT-4)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hoy" })).toBeDisabled();
    vi.useRealTimers();
  });

  it("renderiza BlockSelection con los bloques cuando sí hay disponibilidad", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);
    expect(screen.getByTestId("block-selection")).toHaveAttribute("data-blocks", "1");
  });

  it("muestra el selector de densidad y lo propaga a BlockSelection", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    expect(screen.getByTestId("block-selection")).toHaveAttribute("data-density", "normal");

    fireEvent.click(screen.getByRole("button", { name: "Compacta" }));

    expect(screen.getByTestId("block-selection")).toHaveAttribute("data-density", "compact");
  });

  it("al presionar 'Semana siguiente', vuelve a pedir una semana más adelante", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    const [, firstWeekRange] = mockedUseMentorFreeBlocks.mock.calls[0];
    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
    const lastCall = mockedUseMentorFreeBlocks.mock.calls.at(-1)!;
    const [, nextWeekRange] = lastCall;

    expect(nextWeekRange).toBeDefined();
    expect(new Date(nextWeekRange!.startAt).getTime()).toBeGreaterThan(
      new Date(firstWeekRange!.startAt).getTime()
    );
  });

  it("al presionar 'Semana anterior', vuelve a pedir una semana atrás", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    const [, firstWeekRange] = mockedUseMentorFreeBlocks.mock.calls[0];
    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
    const lastCall = mockedUseMentorFreeBlocks.mock.calls.at(-1)!;
    const [, previousWeekRange] = lastCall;

    expect(new Date(previousWeekRange!.startAt).getTime()).toBeLessThan(
      new Date(firstWeekRange!.startAt).getTime()
    );
  });

  it("al presionar el botón del estado vacío, también avanza a la semana siguiente", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    const [, firstWeekRange] = mockedUseMentorFreeBlocks.mock.calls[0];
    fireEvent.click(screen.getByRole("button", { name: "Ver semana siguiente" }));
    const lastCall = mockedUseMentorFreeBlocks.mock.calls.at(-1)!;
    const [, nextWeekRange] = lastCall;

    expect(new Date(nextWeekRange!.startAt).getTime()).toBeGreaterThan(
      new Date(firstWeekRange!.startAt).getTime()
    );
  });

  it("conserva la densidad compacta al cambiar de semana", () => {
    mockedUseMentorFreeBlocks.mockReturnValue({ blocks: [freeBlock], isLoading: false, error: null });
    render(<MentorFreeBlocksView mentorId="m1" />);

    fireEvent.click(screen.getByRole("button", { name: "Compacta" }));
    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));

    expect(screen.getByTestId("block-selection")).toHaveAttribute("data-density", "compact");
    expect(screen.getByRole("button", { name: "Compacta" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));

    expect(screen.getByTestId("block-selection")).toHaveAttribute("data-density", "compact");
    expect(screen.getByRole("button", { name: "Compacta" })).toHaveAttribute("aria-pressed", "true");
  });
});
