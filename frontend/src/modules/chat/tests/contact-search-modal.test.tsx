import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import {
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";

import { ContactSearchModal } from "../components/contact-search-modal";
import { useContactSearch } from "../hooks/use-contact-search";

expect.extend(matchers);

vi.mock("../hooks/use-contact-search", () => ({
  useContactSearch: vi.fn(),
}));

type SearchResult = ReturnType<typeof useContactSearch>;

const mockRefetch = vi.fn<SearchResult["refetch"]>();

const mockUsers = [
  {
    id: "1",
    fullName: "Maria Peredo",
    headline: "Senior Developer",
    role: "STUDENT",
    avatarUrl: null,
    isActive: true,
  },
  {
    id: "2",
    fullName: "Mario Alcocer",
    headline: "Cloud Architect",
    role: "STUDENT",
    avatarUrl: null,
    isActive: true,
  },
] as SearchResult["results"];

function createSearchResult(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    results: [],
    isSearching: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  };
}

describe("ContactSearchModal - Interfaz y búsqueda", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useContactSearch).mockReturnValue(
      createSearchResult(),
    );
  });

  afterEach(() => {
    cleanup();
  });

  test("debe mostrar los elementos principales del modal", () => {
    render(
      <ContactSearchModal
        isOpen
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />,
    );

    expect(
      screen.getByText("Nueva conversación"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Buscar por nombre..."),
    ).toBeInTheDocument();
  });

  test("debe mostrar los usuarios encontrados", () => {
    vi.mocked(useContactSearch).mockImplementation(
      (term: string) =>
        createSearchResult({
          results: term.trim().length >= 2 ? mockUsers : [],
        }),
    );

    render(
      <ContactSearchModal
        isOpen
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre..."),
      {
        target: { value: "Mari" },
      },
    );

    expect(
      screen.getByText("Maria Peredo"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Mario Alcocer"),
    ).toBeInTheDocument();
  });

  test('debe mostrar "Buscando..." mientras busca usuarios', () => {
    vi.mocked(useContactSearch).mockReturnValue(
      createSearchResult({
        isSearching: true,
      }),
    );

    render(
      <ContactSearchModal
        isOpen
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre..."),
      {
        target: { value: "Maria" },
      },
    );

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Buscando...");
  });

  test("debe mostrar un mensaje cuando no encuentra usuarios", () => {
    render(
      <ContactSearchModal
        isOpen
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre..."),
      {
        target: { value: "UsuarioInexistente" },
      },
    );

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "No hay contactos disponibles que coincidan con tu búsqueda.",
    );
  });

  test("debe cerrar el modal al presionar Escape", () => {
    render(
      <ContactSearchModal
        isOpen
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />,
    );

    fireEvent.keyDown(
      screen.getByPlaceholderText("Buscar por nombre..."),
      {
        key: "Escape",
      },
    );

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});