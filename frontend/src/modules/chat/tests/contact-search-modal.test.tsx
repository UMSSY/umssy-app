
import {
  renderWithQuery as render,
} from "@/shared/testing/render-with-query";

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

const mockUsers = [
  {
    id: "1",
    fullName: "Maria Peredo",
    headline: "Senior Developer",
    role: "MENTOR",
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
];

describe("ContactSearchModal - Interfaz y búsqueda", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // 1. Estructura del modal
  test("debe mostrar los elementos principales del modal", () => {
    vi.mocked(useContactSearch).mockReturnValue({
      results: [],
      isSearching: false,
    });

    render(
      <ContactSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />
    );

    expect(
      screen.getByText("Nueva conversación")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Buscar por nombre...")
    ).toBeInTheDocument();
  });

  // 2. Búsqueda de contactos
  test("debe mostrar los usuarios encontrados", () => {
    vi.mocked(useContactSearch).mockImplementation(
      (term: string) =>
        ({
          results:
            term && term.length >= 2
              ? mockUsers
              : [],
          isSearching: false,
        }) as ReturnType<typeof useContactSearch>
    );

    render(
      <ContactSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />
    );

    const input = screen.getByPlaceholderText(
      "Buscar por nombre..."
    );

    fireEvent.change(input, {
      target: { value: "Maria" },
    });

    expect(
      screen.getByText("Maria Peredo")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Mario Alcocer")
    ).toBeInTheDocument();
  });

  // 3. Estado de carga
  test('debe mostrar "Buscando..." mientras busca usuarios', () => {
    vi.mocked(useContactSearch).mockReturnValue({
      results: [],
      isSearching: true,
    });

    render(
      <ContactSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />
    );

    const input = screen.getByPlaceholderText(
      "Buscar por nombre..."
    );

    fireEvent.change(input, {
      target: { value: "Maria" },
    });

    expect(
      screen.getByRole("status")
    ).toHaveTextContent("Buscando...");
  });

  // 4. Sin resultados
  test("debe mostrar un mensaje cuando no encuentra usuarios", () => {
    vi.mocked(useContactSearch).mockReturnValue({
      results: [],
      isSearching: false,
    });

    render(
      <ContactSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />
    );

    const input = screen.getByPlaceholderText(
      "Buscar por nombre..."
    );

    fireEvent.change(input, {
      target: { value: "UsuarioInexistente" },
    });

    expect(
      screen.getByText(/no se encontraron usuarios/i)
    ).toBeInTheDocument();
  });

  // 5. Cerrar modal
  test("debe cerrar el modal al presionar Escape", () => {
    vi.mocked(useContactSearch).mockReturnValue({
      results: [],
      isSearching: false,
    });

    render(
      <ContactSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectContact={mockOnSelectContact}
      />
    );

    const input = screen.getByPlaceholderText(
      "Buscar por nombre..."
    );

    fireEvent.keyDown(input, {
      key: "Escape",
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
