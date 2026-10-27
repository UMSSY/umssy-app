
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import {
  cleanup,
  fireEvent,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { profileService } from "@/modules/profile/services/profile.service";
import {
  saveAccessToken,
  clearAccessToken,
} from "@/shared/services/storage/access-token-storage";
import * as directoryService from "../services/mentor-directory.service";
import type {
  DirectoryPage,
  MentorDirectoryItem,
} from "../types/mentor-directory.types";
import { MentorProfileNavigation } from "../components/mentor/mentor-profile-navigation";
import { MentorDirectoryView } from "./mentor-directory-view";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/mentorship/mentors",
  search: "",
}));

function applyNavigation(rerender: (element: React.ReactElement) => void) {
  const destination = navigationMocks.replace.mock.lastCall?.[0];

  if (typeof destination === "string") {
    navigationMocks.search = new URL(
      destination,
      "http://localhost",
    ).search;
  }

  rerender(<MentorDirectoryView />);
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
    push: navigationMocks.push,
    back: navigationMocks.back,
    refresh: navigationMocks.refresh,
    forward: navigationMocks.forward,
    prefetch: navigationMocks.prefetch,
  }),
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => new URLSearchParams(navigationMocks.search),
}));

vi.mock("../hooks/use-mentorship-catalogs", () => ({
  useMentorshipCatalogs: () => ({
    technicalAreas: [
      {
        id: "area-backend",
        name: "Backend",
        description: null,
      },
      {
        id: "area-cloud",
        name: "Cloud",
        description: null,
      },
    ],
    isTechnicalAreasLoading: false,
    isTechnicalAreasError: false,
    retryTechnicalAreas: vi.fn(),
    orientationTypes: [
      { id: "1", name: "Búsqueda de empleo", description: null },
      { id: "2", name: "Orientación profesional", description: null },
      { id: "3", name: "Preparación para entrevistas", description: null },
      { id: "4", name: "Revisión de CV", description: null },
      { id: "5", name: "Orientación técnica", description: null },
    ],
    isOrientationTypesLoading: false,
    isOrientationTypesError: false,
    retryOrientationTypes: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearAccessToken();
});

beforeEach(() => {
  navigationMocks.replace.mockReset();
  navigationMocks.push.mockReset();
  navigationMocks.back.mockReset();
  navigationMocks.refresh.mockReset();
  navigationMocks.forward.mockReset();
  navigationMocks.prefetch.mockReset();
  navigationMocks.pathname = "/mentorship/mentors";
  navigationMocks.search = "";
});

const ownId = "0424f370-00f0-43cf-9b8a-997af81840b9";
const otherId = "0fa5e6de-63a4-430e-87fb-22f5eb700ecd";

const mentors: MentorDirectoryItem[] = [
  {
    id: ownId,
    fullName: "María Fernanda Rodríguez",
    headline: "Desarrolladora Backend Senior",
    technicalAreas: ["Backend"],
    photoUrl: null,
    education: null,
    isAvailable: true,
    orientationTypes: ["Orientación técnica"],
  },
  {
    id: otherId,
    fullName: "Carlos Vargas",
    headline: null,
    technicalAreas: [],
    photoUrl: null,
    education: null,
    isAvailable: false,
    orientationTypes: [],
  },
];

function makeDirectoryPage(
  items: MentorDirectoryItem[],
  overrides: Partial<DirectoryPage> = {},
): DirectoryPage {
  return {
    items,
    page: 1,
    pageSize: 6,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / 6),
    effectiveSort: "name_asc",
    ...overrides,
  };
}

/**
 * Simula la respuesta paginada de la API.
 * Aplica filtros y orden a los datos de prueba antes de paginar.
 */
function mockDirectoryWithParams() {
  return vi
    .spyOn(directoryService, "getMentorDirectory")
    .mockImplementation(async (params) => {
      const normalize = (value: string) =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("es")
          .trim();

      const search = normalize(params.search);

      const filtered = mentors.filter((mentor) => {
        const searchableText = normalize(
          [
            mentor.fullName,
            mentor.headline ?? "",
            ...mentor.technicalAreas,
          ].join(" "),
        );

        return (
          searchableText.includes(search) &&
          (!params.area || mentor.technicalAreas.includes(params.area)) &&
          (!params.available || mentor.isAvailable)
        );
      });

      const sorted = [...filtered].sort((a, b) => {
        const comparison = a.fullName.localeCompare(b.fullName, "es", {
          sensitivity: "base",
        });

        return params.sort === "name_desc" ? -comparison : comparison;
      });

      const pageSize = 6;
      const totalItems = sorted.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const page = Math.min(params.page, Math.max(1, totalPages));

      const items =
        totalItems === 0
          ? []
          : sorted.slice((page - 1) * pageSize, page * pageSize);

      return makeDirectoryPage(items, {
        page,
        pageSize,
        totalItems,
        totalPages,
        effectiveSort:
          params.sort === "affinity" ? "name_asc" : params.sort,
      });
    });
}

describe("MentorDirectoryView", () => {
  it("muestra el vacío general sin filtros ni acción innecesaria", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(makeDirectoryPage([]));
    render(<MentorDirectoryView />);
    expect(await screen.findByText("No hay mentores disponibles por el momento")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
  });

  it("muestra el indicador mientras carga el directorio", () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockImplementation(
      () => new Promise<DirectoryPage>(() => {}),
    );

    render(<MentorDirectoryView />);

    expect(
      screen.getByRole("status", {
        name: "Cargando directorio de mentores",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("region", {
        name: "Listado de mentores",
      }),
    ).not.toBeInTheDocument();
  });

  it("muestra el estado sin resultados y permite limpiar los filtros", async () => {
    navigationMocks.search =
      "?search=noexiste&area=Backend&available=false";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([]),
    );

    render(<MentorDirectoryView />);

    expect(
      await screen.findByText("No hay mentores que coincidan con tu búsqueda"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("region", {
        name: "Listado de mentores",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Limpiar filtros",
      }),
    );

    expect(navigationMocks.replace).toHaveBeenLastCalledWith(
      "/mentorship/mentors?page=1",
      { scroll: false },
    );
  });

  it("muestra el error y Reintentar vuelve a consultar el directorio", async () => {
    const getDirectory = vi
      .spyOn(directoryService, "getMentorDirectory")
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(makeDirectoryPage([mentors[0]]));

    render(<MentorDirectoryView />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("No pudimos cargar el directorio");

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: "Reintentar",
      }),
    );

    expect(
      await screen.findByRole("link", {
        name: /Ver perfil de María/,
      }),
    ).toBeInTheDocument();

    expect(getDirectory).toHaveBeenCalledTimes(2);
  });

  it("renderiza el encabezado del directorio", () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([]),
    );

    render(<MentorDirectoryView />);

    expect(
      screen.getByRole("heading", {
        name: "Encuentra un mentor",
      }),
    ).toBeInTheDocument();
  });

  it("mantiene filtros accesibles, utilizables con teclado y preparados para pantallas estrechas", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([mentors[0]]),
    );

    render(<MentorDirectoryView />);

    await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    const filters = screen.getByRole("search", {
      name: "Filtros de mentores",
    });

    expect(filters).toHaveClass("flex", "flex-wrap");

    expect(
      within(filters).getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
    ).toBeVisible();

    expect(
      within(filters).getByRole("combobox", {
        name: "Área técnica",
      }),
    ).toBeVisible();

    expect(
      within(filters).getByRole("combobox", {
        name: "Orientación",
      }),
    ).toBeVisible();

    const checkbox = within(filters).getByRole("checkbox", {
      name: "Solo disponibles",
    });

    expect(checkbox).toBeVisible();

    expect(
      within(filters).getByRole("combobox", {
        name: "Ordenar mentores",
      }),
    ).toBeVisible();

    const clearButton = within(filters).getByRole("button", {
      name: "Limpiar",
    });

    expect(clearButton).toBeVisible();

    const user = userEvent.setup();

    checkbox.focus();
    expect(checkbox).toHaveFocus();

    await user.keyboard(" ");

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/mentorship/mentors?page=1&available=true",
      { scroll: false },
    );

    clearButton.focus();
    expect(clearButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/mentorship/mentors?page=1",
      { scroll: false },
    );
  });

  it("renderiza enlaces hacia los perfiles de los mentores", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([mentors[0]]),
    );

    render(<MentorDirectoryView />);

    expect(
      await screen.findAllByRole("link", {
        name: /Ver perfil de/i,
      }),
    ).not.toHaveLength(0);
  });

  it("distingue la tarjeta propia por UUID sin repetir la consulta de identidad", async () => {
    saveAccessToken("test-token");

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors),
    );

    const getProfile = vi
      .spyOn(profileService, "getProfile")
      .mockResolvedValue({
        id: ownId,
        firstName: "María",
        lastName: "Rodríguez",
        institutionalEmail: "maria@example.test",
        personalEmail: null,
        phone: null,
        city: null,
        headline: null,
        aboutMe: null,
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

    render(<MentorDirectoryView />);

    const ownLink = await screen.findByRole("link", {
      name: "Ver mi perfil de María Fernanda Rodríguez",
    });

    const otherLink = screen.getByRole("link", {
      name: "Ver perfil de Carlos Vargas",
    });

    const expectedReturnTo = "?returnTo=%2Fmentorship%2Fmentors";

    expect(ownLink).toHaveTextContent("Ver mi perfil");
    expect(ownLink).toHaveAttribute(
      "href",
      `/mentors/${ownId}${expectedReturnTo}`,
    );

    expect(otherLink).toHaveTextContent("Ver perfil");
    expect(otherLink).toHaveAttribute(
      "href",
      `/mentors/${otherId}${expectedReturnTo}`,
    );

    expect(screen.getByText("Disponible para mentoría")).toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.getByText("Orientación técnica")).toBeInTheDocument();

    expect(getProfile).toHaveBeenCalledTimes(1);
  });

  it("conserva el directorio público sin sesión", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors),
    );

    const getProfile = vi.spyOn(profileService, "getProfile");

    render(<MentorDirectoryView />);

    expect(
      await screen.findAllByRole("link", {
        name: /Ver perfil de/,
      }),
    ).toHaveLength(2);

    expect(screen.queryByText("Ver mi perfil")).not.toBeInTheDocument();
    expect(getProfile).not.toHaveBeenCalled();
  });

  it("muestra todos los mentores por defecto y Limpiar restablece los filtros", async () => {
    mockDirectoryWithParams();

    const { rerender } = render(<MentorDirectoryView />);

    expect(
      screen.getByRole("checkbox", { name: "Solo disponibles" }),
    ).not.toBeChecked();

    expect(
      await screen.findByRole("link", {
        name: /Ver perfil de María/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /Ver perfil de Carlos/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Limpiar" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Solo disponibles",
      }),
    );

    applyNavigation(rerender);

    await waitFor(() => expect(screen.queryByRole("link", { name: /Ver perfil de Carlos/ })).not.toBeInTheDocument());
    expect(screen.queryByText("No disponible")).not.toBeInTheDocument();

    const searchCallsBeforeMaria =
      navigationMocks.replace.mock.calls.length;

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
      { target: { value: "maria" } },
    );

    await waitFor(() => {
      expect(navigationMocks.replace.mock.calls.length).toBeGreaterThan(
        searchCallsBeforeMaria,
      );
    });

    applyNavigation(rerender);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("combobox", { name: "Área técnica" }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Backend" }),
    );

    applyNavigation(rerender);

    fireEvent.click(
      screen.getByRole("button", { name: "Limpiar" }),
    );

    applyNavigation(rerender);

    expect(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
    ).toHaveValue("");

    expect(
      screen.getByRole("combobox", { name: "Área técnica" }),
    ).toHaveTextContent("Todas");

    expect(
      screen.getByRole("combobox", { name: "Orientación" }),
    ).toHaveTextContent("Todas");

    expect(
      screen.getByRole("checkbox", { name: "Solo disponibles" }),
    ).not.toBeChecked();

    expect(
      await screen.findByRole("link", {
        name: /Ver perfil de María/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /Ver perfil de Carlos/,
      }),
    ).toBeInTheDocument();
  });

  it("restaura búsqueda, área, orientación y disponibilidad al volver desde el perfil", async () => {
    navigationMocks.search =
      "?page=2&search=maria&area=Backend&orientation=Orientaci%C3%B3n%20t%C3%A9cnica&available=false&sort=affinity";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors, {
        page: 2,
        totalPages: 3,
      }),
    );

    const view = render(<MentorDirectoryView />);

    await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    expect(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
    ).toHaveValue("maria");

    expect(
      screen.getByRole("combobox", {
        name: "Área técnica",
      }),
    ).toHaveTextContent("Backend");

    expect(
      screen.getByRole("combobox", {
        name: "Orientación",
      }),
    ).toHaveTextContent("Orientación técnica");

    expect(
      screen.getByRole("checkbox", {
        name: "Solo disponibles",
      }),
    ).not.toBeChecked();

    const returnTo =
      `/mentorship/mentors${new URLSearchParams(navigationMocks.search).toString() ? `?${new URLSearchParams(navigationMocks.search).toString()}` : ""}`;

    const profileLink = screen.getByRole("link", {
      name: /Ver perfil de María/,
    });

    expect(profileLink).toHaveAttribute(
      "href",
      `/mentors/${ownId}?returnTo=${encodeURIComponent(returnTo)}`,
    );

    view.rerender(
      <MentorProfileNavigation
        mentorName="María"
        returnTo={returnTo}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Volver al directorio",
      }),
    ).toHaveAttribute("href", returnTo);

    view.rerender(<MentorDirectoryView />);

    await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    expect(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
    ).toHaveValue("maria");

    expect(
      screen.getByRole("combobox", {
        name: "Área técnica",
      }),
    ).toHaveTextContent("Backend");

    expect(
      screen.getByRole("combobox", {
        name: "Orientación",
      }),
    ).toHaveTextContent("Orientación técnica");

    expect(
      screen.getByRole("checkbox", {
        name: "Solo disponibles",
      }),
    ).not.toBeChecked();
  });

  it("conserva los filtros y la página en el enlace al perfil", async () => {
    navigationMocks.search =
      "?page=2&search=maria&area=Backend&available=true&sort=affinity&module=chat";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors, { page: 2, totalPages: 3 }),
    );

    render(<MentorDirectoryView />);

    const profileLink = await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    expect(profileLink).toHaveAttribute(
      "href",
      `/mentors/${ownId}?returnTo=${encodeURIComponent(
        "/mentorship/mentors?page=2&search=maria&area=Backend&available=true&sort=affinity&module=chat",
      )}`,
    );
  });

  it("restaura página 2, Backend y afinidad tras perfil, retorno y F5", async () => {
    navigationMocks.search = "?page=2&area=Backend&sort=affinity&module=chat";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors, { page: 2, totalPages: 3 }),
    );

    const view = render(<MentorDirectoryView />);

    const selector = await screen.findByRole("combobox", {
      name: "Ordenar mentores",
    });

    await screen.findByRole("link", { name: /Ver perfil de María/ });

    expect(selector).toHaveValue("affinity");

    expect(
      screen.getByRole("combobox", { name: "Área técnica" }),
    ).toHaveTextContent("Backend");

    expect(screen.getByRole("note")).toHaveTextContent(
      "todavía no está disponible",
    );

    const returnTo = `/mentorship/mentors${navigationMocks.search}`;

    const profileLink = await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    expect(profileLink).toHaveAttribute(
      "href",
      `/mentors/${ownId}?returnTo=${encodeURIComponent(returnTo)}`,
    );

    view.rerender(
      <MentorProfileNavigation mentorName="María" returnTo={returnTo} />,
    );

    expect(
      screen.getByRole("link", { name: "Volver al directorio" }),
    ).toHaveAttribute("href", returnTo);

    view.rerender(<MentorDirectoryView />);

    expect(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
    ).toHaveValue("affinity");

    expect(
      screen.getByRole("combobox", { name: "Área técnica" }),
    ).toHaveTextContent("Backend");

    view.unmount();

    render(<MentorDirectoryView />);

    await screen.findByRole("link", { name: /Ver perfil de María/ });

    expect(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
    ).toHaveValue("affinity");

    expect(
      screen.getByRole("combobox", { name: "Área técnica" }),
    ).toHaveTextContent("Backend");

    expect(navigationMocks.search).toContain("page=2");
    expect(navigationMocks.search).toContain("module=chat");
  });

  it("conserva el selector de tres opciones y restaura el orden solicitado desde la URL", async () => {
    navigationMocks.search =
      "?page=2&area=Backend&sort=name_desc&module=chat";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([mentors[0]], {
        page: 2,
        totalPages: 3,
        totalItems: 13,
        effectiveSort: "name_desc",
      }),
    );

    const { rerender } = render(<MentorDirectoryView />);

    await screen.findByRole("link", { name: /Ver perfil de María/ });

    const selector = screen.getByRole("combobox", {
      name: "Ordenar mentores",
    });

    expect(selector).toHaveValue("name_desc");

    expect(
      within(selector)
        .getAllByRole("option")
        .map((option) => option.getAttribute("value")),
    ).toEqual(["name_asc", "name_desc", "affinity"]);

    fireEvent.change(selector, { target: { value: "affinity" } });

    expect(navigationMocks.replace).toHaveBeenLastCalledWith(
      "/mentorship/mentors?page=1&area=Backend&sort=affinity&module=chat",
      { scroll: false },
    );

    applyNavigation(rerender);

    expect(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
    ).toHaveValue("affinity");

    expect(
      await screen.findByRole("heading", { name: "Preferencias" }),
    ).toBeVisible();
  });

  it("muestra insignias solo con afinidad efectiva y conteos provistos", async () => {
    navigationMocks.search = "?sort=affinity";

    const mentorsWithAffinity: MentorDirectoryItem[] = [
      { ...mentors[0], sharedInterestsCount: 2 },
      { ...mentors[1], sharedInterestsCount: 0 },
    ];

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentorsWithAffinity, {
        effectiveSort: "affinity",
      }),
    );

    const { rerender } = render(
      <MentorDirectoryView
        directoryState={{
          effectiveSort: "affinity",
          affinityStatus: "ready",
        }}
      />,
    );

    expect(await screen.findByText("2 intereses en común")).toBeVisible();
    expect(screen.getByText("0 intereses en común")).toBeVisible();

    navigationMocks.search = "?sort=name_asc";

    rerender(
      <MentorDirectoryView
        directoryState={{
          effectiveSort: "affinity",
          affinityStatus: "ready",
        }}
      />,
    );

    expect(
      screen.queryByText(/intereses? en común/),
    ).not.toBeInTheDocument();
  });

  it("omite la insignia si el servidor aplicó A–Z aunque la URL solicite afinidad", async () => {
    navigationMocks.search = "?sort=affinity";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage([{ ...mentors[0], sharedInterestsCount: 2 }], {
        effectiveSort: "name_asc",
        affinityStatus: "unmapped_skills",
      }),
    );

    render(<MentorDirectoryView />);

    await screen.findByRole("link", { name: /Ver perfil de María/ });

    expect(screen.getByRole("combobox", { name: "Ordenar mentores" })).toHaveValue(
      "affinity",
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "aún no tienen correspondencia",
    );
    expect(screen.queryByText("2 intereses en común")).not.toBeInTheDocument();
  });

  it("ordena por nombre A–Z y Z–A según el parámetro solicitado", async () => {
    navigationMocks.search = "?available=false";
    mockDirectoryWithParams();

    const { rerender } = render(<MentorDirectoryView />);

    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });

    const names = () =>
      within(screen.getByRole("region", { name: "Listado de mentores" }))
        .getAllByRole("heading")
        .map((heading) => heading.textContent);

    await waitFor(() => {
      expect(names()).toEqual([
        "Carlos Vargas",
        "María Fernanda Rodríguez",
      ]);
    });

    fireEvent.change(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
      { target: { value: "name_desc" } },
    );

    applyNavigation(rerender);

    await waitFor(() => {
      expect(names()).toEqual([
        "María Fernanda Rodríguez",
        "Carlos Vargas",
      ]);
    });

    expect(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
    ).toHaveValue("name_desc");
  });

  it("normaliza una página fuera de rango cuando recibe totalPages", () => {
    navigationMocks.search =
      "?page=9&area=Backend&sort=affinity&module=chat";

    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      makeDirectoryPage(mentors, { totalPages: 3 }),
    );

    render(
      <MentorDirectoryView
        directoryState={{
          effectiveSort: "name_asc",
          affinityStatus: "no_skills",
          totalPages: 3,
        }}
      />,
    );

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/mentorship/mentors?page=3&area=Backend&sort=affinity&module=chat",
      { scroll: false },
    );
  });

  it.each([
    ["no_skills", "Agrega habilidades profesionales"],
    ["unmapped_skills", "aún no tienen correspondencia"],
    ["ready", "El orden por afinidad no se aplicó"],
  ] as const)(
    "explica la afinidad no aplicada con estado %s",
    async (affinityStatus, message) => {
      navigationMocks.search = "?sort=affinity";

      vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
        makeDirectoryPage(mentors, {
          effectiveSort: "name_asc",
        }),
      );

      render(
        <MentorDirectoryView
          directoryState={{
            effectiveSort: "name_asc",
            affinityStatus,
          }}
        />,
      );

      await screen.findByRole("link", {
        name: /Ver perfil de Carlos/,
      });

      expect(screen.getByRole("note")).toHaveTextContent(message);

      expect(
        screen.queryByText(/intereses? en común/),
      ).not.toBeInTheDocument();

      expect(
        screen.getAllByRole("link", { name: /Ver perfil de/ }),
      ).toHaveLength(2);
    },
  );
});
