import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { buildLoginUrl } from "@/modules/auth/utils/safe-next-path";
import { registrationsService as registrationApi } from "@/modules/registrations";
import { toast } from "sonner";
import { useEvent } from "../hooks/use-event";
import { useEvents } from "../hooks/use-events";
import { useEventsFilters } from "../hooks/use-events-filters";
import { useEventCategories } from "../../event-categories/hooks/use-event-categories";
import { registrationsService } from "../services/registrations.service";
import type { EventItem } from "../types/event.types";
import type { EventDetail } from "../types/event-detail.types";
import type { ProposalSupportResponse } from "../types/proposal-support-response.types";
import { EventsView } from "./events-view";
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

vi.mock("../hooks/use-event", () => ({ useEvent: vi.fn() }));
vi.mock("../hooks/use-events", () => ({
  useEvents: vi.fn(),
}));
vi.mock("../hooks/use-events-filters", () => ({
  useEventsFilters: vi.fn(),
}));
vi.mock("../../event-categories/hooks/use-event-categories", () => ({
  useEventCategories: vi.fn(),
}));

const MOCK_EVENTS: EventItem[] = [
  {
    id: "e1a2b3c4-0001-4000-8000-000000000001",
    title: "Desarrollo Web con React",
    description: "Taller practico.",
    category: {
      id: "a1a1a1a1-0001-4000-8000-000000000001",
      name: "Tecnologia",
    },
    instructorName: "Ing. Carlos Mendoza",
    eventDate: "2026-10-15",
    startTime: "09:00",
    endTime: "13:00",
    location: "Auditorio FCyT",
    capacity: 30,
    availableSpots: 6,
    registrationCount: 24,
    statusId: "b1b1b1b1-0001-4000-8000-000000000001",
    modalityId: "c1c1c1c1-0001-4000-8000-000000000001",
  },
];

const PROPOSAL: EventDetail = {
  ...MOCK_EVENTS[0],
  status: "voting",
  supportCount: 14,
  supportThreshold: 20,
  supportsRemaining: 6,
  progressPercent: 70,
  hasSupported: false,
  modality: { id: "m1", title: "Presencial" },
};

const SUPPORT_RESPONSE: ProposalSupportResponse = {
  eventId: PROPOSAL.id,
  status: "voting",
  supportCount: 15,
  supportThreshold: 20,
  supportsRemaining: 5,
  progressPercent: 75,
  hasSupported: true,
};

function tokenWithRoles(roles: string[]) {
  return `header.${btoa(JSON.stringify({ roles }))}.signature`;
}

function showProposal(event: EventDetail = PROPOSAL) {
  vi.mocked(useEvent).mockImplementation((id) => ({
    event: id ? event : null,
    isLoading: false,
    error: null,
    notFound: false,
    retry: vi.fn(),
  }));
}

const mockUseEvents = vi.mocked(useEvents);
const mockUseEventsFilters = vi.mocked(useEventsFilters);
const mockUseEventCategories = vi.mocked(useEventCategories);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  clearAccessToken();
  vi.restoreAllMocks();
  push.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.info).mockClear();
});

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-10T12:00:00Z"), toFake: ["Date"] });
  vi.mocked(useEvent).mockReturnValue({
    event: null,
    isLoading: false,
    error: null,
    notFound: false,
    retry: vi.fn(),
  });
  mockUseEventsFilters.mockReturnValue({
    searchInput: "",
    setSearchInput: vi.fn(),
    categoryId: null,
    setCategoryId: vi.fn(),
    filters: { search: "", categoryId: null },
  });
  mockUseEventCategories.mockReturnValue({
    retry: vi.fn(),
    categories: [{ id: "cat-1", name: "Tecnología" }],
    isLoading: false,
    error: null,
  });
  mockUseEvents.mockReturnValue({
    events: MOCK_EVENTS,
    error: null,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    retry: vi.fn(),
  });
});

describe("EventsView", () => {
  it.each(["button", "escape", "empty space", "outside view", "heading", "search click", "search focus", "search change", "category", "all categories"])("closes the selected workshop using %s", (method) => {
    vi.mocked(useEvent).mockImplementation((id) => ({
      event: id ? { ...MOCK_EVENTS[0], modality: { id: "m1", title: "Presencial" } } : null,
      isLoading: false,
      error: null,
      notFound: false,
      retry: vi.fn(),
    }));
    render(<EventsView />);
    const card = within(screen.getByRole("region", { name: /listado de talleres/i }))
      .getByRole("button", { name: /desarrollo web con react/i });
    fireEvent.click(card);
    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeInTheDocument();
    if (method === "button") {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle del taller" }));
    } else if (method === "escape") {
      fireEvent.keyDown(document, { key: "Escape" });
    } else if (method === "heading") {
      fireEvent.click(screen.getByRole("heading", { name: "Talleres y eventos" }));
    } else if (method === "outside view") {
      fireEvent.click(document.body);
    } else if (method === "search click") {
      fireEvent.click(screen.getByRole("searchbox", { name: "Buscar taller" }));
    } else if (method === "search focus") {
      fireEvent.focusIn(screen.getByRole("searchbox", { name: "Buscar taller" }));
    } else if (method === "search change") {
      fireEvent.change(screen.getByRole("searchbox", { name: "Buscar taller" }), { target: { value: "Prisma" } });
    } else if (method === "category" || method === "all categories") {
      fireEvent.click(screen.getByRole("button", { name: method === "category" ? "Tecnología" : "Todos" }));
    } else {
      fireEvent.click(screen.getByRole("region", { name: /listado de talleres/i }));
    }
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Inscribirme" })).not.toBeInTheDocument();
    expect(useEvent).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
  it("keeps the selection when interacting with cards and detail", () => {
    vi.mocked(useEvent).mockImplementation((id) => ({
      event: id ? { ...MOCK_EVENTS[0], modality: { id: "m1", title: "Presencial" } } : null,
      isLoading: false,
      error: null,
      notFound: false,
      retry: vi.fn(),
    }));
    render(<EventsView />);
    const card = within(screen.getByRole("region", { name: /listado de talleres/i }))
      .getByRole("button", { name: /desarrollo web con react/i });
    fireEvent.click(within(card).getByRole("heading"));
    fireEvent.click(screen.getByRole("complementary", { name: "Detalle de Desarrollo Web con React" }));
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeInTheDocument();
  });

  it("keeps the selected workshop while its confirmation dialog is open", () => {
    vi.mocked(useEvent).mockImplementation((id) => ({
      event: id ? { ...MOCK_EVENTS[0], modality: { id: "m1", title: "Presencial" } } : null,
      isLoading: false,
      error: null,
      notFound: false,
      retry: vi.fn(),
    }));
    render(<EventsView />);
    const card = within(screen.getByRole("region", { name: /listado de talleres/i }))
      .getByRole("button", { name: /desarrollo web con react/i });
    fireEvent.click(card);
    const dialog = document.createElement("div");
    dialog.setAttribute("data-registration-dialog", "");
    document.body.append(dialog);
    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(dialog);
    expect(card).toHaveAttribute("aria-pressed", "true");
    dialog.remove();
    const overlay = document.createElement("div");
    overlay.setAttribute("data-slot", "dialog-overlay");
    document.body.append(overlay);
    fireEvent.click(overlay);
    expect(card).toHaveAttribute("aria-pressed", "true");
    overlay.remove();
  });
  it("renders only the workshop list until a workshop is selected", () => {
    render(<EventsView />);

    expect(
      screen.getByRole("heading", { name: /talleres y eventos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 talleres disponibles/i)).toBeInTheDocument();
    expect(
      screen.getByRole("search", { name: /filtros de talleres/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("muestra estado de carga y lista vacia", () => {
    mockUseEvents.mockReturnValue({
      events: [],
      error: null,
      hasMore: false,
      isLoading: true,
      isLoadingMore: false,
      loadMore: vi.fn(),
      retry: vi.fn(),
    });

    const { rerender } = render(<EventsView />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando talleres");

    mockUseEvents.mockReturnValue({
      events: [],
      error: null,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
      retry: vi.fn(),
    });
    rerender(<EventsView />);

    expect(
      screen.getByText("No hay talleres disponibles."),
    ).toBeInTheDocument();
  });

  it("muestra el error del backend y permite reintentar", () => {
    const retry = vi.fn();
    mockUseEvents.mockReturnValue({
      events: [],
      error: "No se pudieron cargar los talleres.",
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
      retry,
    });

    render(<EventsView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renderiza las tarjetas EventCard y permite seleccionar un taller al hacer clic", () => {
    render(<EventsView />);

    const workshopList = screen.getByRole("region", {
      name: /listado de talleres/i,
    });
    const firstWorkshopCard = within(workshopList).getByRole("button", {
      name: /desarrollo web con react/i,
    });

    expect(firstWorkshopCard).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(firstWorkshopCard);
    expect(firstWorkshopCard).toHaveAttribute("aria-pressed", "true");
  });

  it("solicita mas eventos cuando el endpoint indica otra pagina", () => {
    const loadMore = vi.fn();
    mockUseEvents.mockReturnValue({
      events: MOCK_EVENTS,
      error: null,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      loadMore,
      retry: vi.fn(),
    });

    render(<EventsView />);

    fireEvent.click(
      screen.getByRole("button", { name: "Cargar más talleres" }),
    );
    expect(loadMore).toHaveBeenCalledOnce();
  });

  it("conecta la búsqueda y las categorías con los filtros de eventos", () => {
    render(<EventsView />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar taller" }), {
      target: { value: "Prisma" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tecnología" }));

    const filterState = mockUseEventsFilters.mock.results[0].value;
    expect(filterState.setSearchInput).toHaveBeenCalledWith("Prisma");
    expect(filterState.setCategoryId).toHaveBeenCalledWith("cat-1");
    expect(mockUseEvents).toHaveBeenCalledWith(filterState.filters);
  });
  it("shows category loading without hiding the workshops", () => {
    mockUseEventCategories.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      retry: vi.fn(),
    });
    render(<EventsView />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando categorías");
    expect(
      screen.getByRole("heading", { name: "Desarrollo Web con React" }),
    ).toBeInTheDocument();
  });

  it("lets users retry categories independently of workshops", () => {
    const retry = vi.fn();
    mockUseEventCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      error: "No se pudieron cargar las categorías.",
      retry,
    });
    render(<EventsView />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las categorías",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar categorías" }),
    );
    expect(retry).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", { name: "Desarrollo Web con React" }),
    ).toBeInTheDocument();
  });

  it("explains when no workshops match the selected filters", () => {
    mockUseEventsFilters.mockReturnValue({
      searchInput: "Marketing",
      setSearchInput: vi.fn(),
      categoryId: null,
      setCategoryId: vi.fn(),
      filters: { search: "Marketing", categoryId: null },
    });
    mockUseEvents.mockReturnValue({
      events: [],
      error: null,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
      retry: vi.fn(),
    });
    render(<EventsView />);
    expect(
      screen.getByText(/No se encontraron talleres con esos filtros/),
    ).toBeInTheDocument();
  });

  it("queries the selected workshop and shows loading without previous detail", () => {
    vi.mocked(useEvent).mockImplementation((id) => ({
      event: null,
      isLoading: id !== null,
      error: null,
      notFound: false,
      retry: vi.fn(),
    }));
    render(<EventsView />);
    fireEvent.click(
      screen.getByRole("button", { name: /desarrollo web con react/i }),
    );
    expect(useEvent).toHaveBeenLastCalledWith(MOCK_EVENTS[0].id);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando detalle");
    expect(
      screen.queryByRole("button", { name: "Inscribirme" }),
    ).not.toBeInTheDocument();
  });

  it("shows detail errors with retry and a distinct not-found state", () => {
    const retry = vi.fn();
    vi.mocked(useEvent).mockReturnValue({
      event: null,
      isLoading: false,
      error: "Error de detalle",
      notFound: false,
      retry,
    });
    const { rerender } = render(<EventsView />);
    fireEvent.click(screen.getByRole("button", { name: /desarrollo web con react/i }));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar detalle" }));
    expect(retry).toHaveBeenCalledOnce();
    vi.mocked(useEvent).mockReturnValue({
      event: null,
      isLoading: false,
      error: "El taller no existe.",
      notFound: true,
      retry,
    });
    rerender(<EventsView />);
    expect(screen.getByRole("alert")).toHaveTextContent("El taller no existe.");
    expect(
      screen.queryByRole("button", { name: "Reintentar detalle" }),
    ).not.toBeInTheDocument();
  });
});

describe("EventsView proposal support", () => {
  beforeEach(() => {
    mockUseEvents.mockReturnValue({
      events: [PROPOSAL], error: null, hasMore: false, isLoading: false,
      isLoadingMore: false, loadMore: vi.fn(), retry: vi.fn(),
    });
  });

  it("sends guests to login and returns them to the selected proposal", () => {
    showProposal();
    const supportRequest = vi.spyOn(registrationsService, "supportProposal");
    render(<EventsView initialProposalId={PROPOSAL.id} />);

    expect(screen.getByText("Inicia sesión para apoyar esta propuesta.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));

    expect(push).toHaveBeenCalledWith(buildLoginUrl(`/events?proposal=${PROPOSAL.id}`));
    expect(supportRequest).not.toHaveBeenCalled();
  });

  it("blocks accounts without the Titulado role before sending a request", () => {
    saveAccessToken(tokenWithRoles(["estudiante"]));
    showProposal();
    const supportRequest = vi.spyOn(registrationsService, "supportProposal");
    render(<EventsView initialProposalId={PROPOSAL.id} />);

    expect(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" })).toBeDisabled();
    expect(screen.getByText("Solo los usuarios con perfil Titulado pueden apoyar propuestas.")).toBeInTheDocument();
    expect(supportRequest).not.toHaveBeenCalled();
  });

  it("submits once, shows pending state, and reflects a registered support", async () => {
    const token = tokenWithRoles(["titulado"]);
    saveAccessToken(token);
    showProposal();
    let resolve!: (value: ProposalSupportResponse) => void;
    const supportRequest = vi.spyOn(registrationsService, "supportProposal")
      .mockImplementation(() => new Promise((done) => { resolve = done; }));
    const { rerender } = render(<EventsView initialProposalId={PROPOSAL.id} />);

    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));
    await waitFor(() => expect(supportRequest).toHaveBeenCalledExactlyOnceWith(PROPOSAL.id, token));
    expect(screen.getByRole("button", { name: "Registrando apoyo..." })).toBeDisabled();

    await act(async () => { resolve(SUPPORT_RESPONSE); });
    showProposal({ ...PROPOSAL, hasSupported: true, supportCount: 15, supportsRemaining: 5, progressPercent: 75 });
    rerender(<EventsView initialProposalId={PROPOSAL.id} />);
    expect(screen.getByRole("button", { name: "Ya apoyaste esta propuesta" })).toBeDisabled();
    expect(screen.getByText("15 de 20 apoyos")).toBeInTheDocument();
  });

  it("keeps the action blocked after an already supported response", async () => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    vi.spyOn(registrationsService, "supportProposal").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, ok: false, data: null, code: "ALREADY_SUPPORTED", detail: "Private detail" } },
    });
    render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Ya apoyaste esta propuesta" })).toBeDisabled());
    expect(screen.getByRole("complementary", { name: `Detalle de ${PROPOSAL.title}` }))
      .toHaveTextContent("Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.");
    expect(within(screen.getByRole("region", { name: "Listado de talleres" }))
      .getByRole("button", { name: /desarrollo web con react/i }))
      .toHaveTextContent("Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar apoyo" })).not.toBeInTheDocument();
  });

  it("offers a retry after a network failure", async () => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    const supportRequest = vi.spyOn(registrationsService, "supportProposal")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(SUPPORT_RESPONSE);
    render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Reintentar apoyo" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar apoyo" }));
    await waitFor(() => expect(supportRequest).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar apoyo" })).not.toBeInTheDocument());
  });

  it("replaces a proposal that expired during the open detail", async () => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    vi.spyOn(registrationsService, "supportProposal").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, ok: false, data: null, code: "PROPOSAL_EXPIRED", detail: "Private detail" } },
    });
    const { rerender } = render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("La propuesta ya venció."));

    const expired = { ...PROPOSAL, status: "Vencido" };
    showProposal(expired);
    mockUseEvents.mockReturnValue({ events: [expired], error: null, hasMore: false, isLoading: false, isLoadingMore: false, loadMore: vi.fn(), retry: vi.fn() });
    rerender(<EventsView initialProposalId={PROPOSAL.id} />);

    expect(within(screen.getByRole("complementary", { name: `Detalle de ${PROPOSAL.title}` }))
      .getByText("Fecha límite superada · vencida automáticamente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" })).toBeDisabled();
  });

  it("offers normal registration if another support published the proposal", async () => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    vi.spyOn(registrationApi, "getOwn").mockResolvedValue(null);
    vi.spyOn(registrationsService, "supportProposal").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, ok: false, data: null, code: "EVENT_NOT_SUPPORTABLE", detail: "Private detail" } },
    });
    const { rerender } = render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("La propuesta ya no acepta apoyos."));

    const published = { ...PROPOSAL, status: "Publicado", hasSupported: false, registrationCount: 20, availableSpots: 10 };
    showProposal(published);
    mockUseEvents.mockReturnValue({ events: [published], error: null, hasMore: false, isLoading: false, isLoadingMore: false, loadMore: vi.fn(), retry: vi.fn() });
    rerender(<EventsView initialProposalId={PROPOSAL.id} />);

    expect(screen.getByRole("button", { name: "Inscribirme" })).toHaveClass("bg-brand-red");
    expect(screen.queryByRole("button", { name: "Preinscribirme/Apoyar propuesta" })).not.toBeInTheDocument();
  });

  it("shows publication and the confirmed registration after reaching the threshold", async () => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    vi.spyOn(registrationApi, "getOwn").mockResolvedValue(null);
    vi.spyOn(registrationsService, "supportProposal").mockResolvedValue({
      ...SUPPORT_RESPONSE, status: "Publicado", supportCount: 20, supportsRemaining: 0, progressPercent: 100,
    });
    const { rerender } = render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));

    await waitFor(() => expect(screen.getByText(/La propuesta fue publicada y tu inscripción quedó confirmada/)).toBeInTheDocument());
    showProposal({ ...PROPOSAL, status: "Publicado", hasSupported: true, supportCount: 20, registrationCount: 20, availableSpots: 0 });
    rerender(<EventsView initialProposalId={PROPOSAL.id} />);

    expect(screen.getByRole("button", { name: "Ya estás inscrito" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Preinscribirme/Apoyar propuesta" })).not.toBeInTheDocument();
  });

  it.each([
    ["AUTH_REQUIRED", 401],
    ["EVENT_NOT_FOUND", 404],
  ])("handles %s after an attempted support", async (code, status) => {
    saveAccessToken(tokenWithRoles(["titulado"]));
    showProposal();
    vi.spyOn(registrationsService, "supportProposal").mockRejectedValue({
      isAxiosError: true,
      response: { status, data: { statusCode: status, ok: false, data: null, code, detail: "Private detail" } },
    });
    render(<EventsView initialProposalId={PROPOSAL.id} />);
    fireEvent.click(screen.getByRole("button", { name: "Preinscribirme/Apoyar propuesta" }));

    if (code === "AUTH_REQUIRED") {
      await waitFor(() => expect(push).toHaveBeenCalledWith(buildLoginUrl(`/events?proposal=${PROPOSAL.id}`)));
      expect(toast.info).toHaveBeenCalledWith("Debes iniciar sesión para apoyar una propuesta.");
    } else {
      await waitFor(() => expect(screen.queryByRole("complementary", { name: `Detalle de ${PROPOSAL.title}` })).not.toBeInTheDocument());
      expect(toast.error).toHaveBeenCalledWith("No encontramos la propuesta solicitada.");
    }
  });
});
