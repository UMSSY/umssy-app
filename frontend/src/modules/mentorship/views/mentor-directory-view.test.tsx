import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import {
  cleanup,
  fireEvent,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("combina búsqueda sin tildes, filtros de área y disponibilidad, y permite reiniciarlos", async () => {
    mockDirectoryWithParams();

    const { rerender } = render(<MentorDirectoryView />);

    await screen.findByRole("link", {
      name: /Ver perfil de María/,
    });

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar mentor" }),
      { target: { value: "maria" } },
    );

    applyNavigation(rerender);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", {
          name: /Ver perfil de Carlos/,
        }),
      ).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Área" }), {
      target: { value: "Backend" },
    });

    applyNavigation(rerender);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Con disponibilidad",
      }),
    );

    applyNavigation(rerender);

    expect(
      await screen.findByRole("link", {
        name: /Ver perfil de María/,
      }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar mentor" }),
      { target: { value: "noexiste" } },
    );

    applyNavigation(rerender);

    expect(
      await screen.findByText("No hay mentores con estos filtros"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Limpiar filtros",
      })[0],
    );

    applyNavigation(rerender);

    expect(
      await screen.findByRole("link", {
        name: /Ver perfil de Carlos/,
      }),
    ).toBeInTheDocument();
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

    expect(screen.getByRole("combobox", { name: "Área" })).toHaveValue(
      "Backend",
    );

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

    expect(screen.getByRole("combobox", { name: "Área" })).toHaveValue(
      "Backend",
    );

    view.unmount();

    render(<MentorDirectoryView />);

    await screen.findByRole("link", { name: /Ver perfil de María/ });

    expect(
      screen.getByRole("combobox", { name: "Ordenar mentores" }),
    ).toHaveValue("affinity");

    expect(screen.getByRole("combobox", { name: "Área" })).toHaveValue(
      "Backend",
    );

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

  it("ordena por nombre A–Z y Z–A según el parámetro solicitado", async () => {
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