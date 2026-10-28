import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MentorDirectoryItem } from "../../types/mentor-directory.types";
import { MentorCard } from "./mentor-card";

const mentor: MentorDirectoryItem = {
  id: "0424f370-00f0-43cf-9b8a-997af81840b9",
  fullName: "María Fernanda Rodríguez",
  headline: "Desarrolladora Backend Senior",
  technicalAreas: ["Backend", "APIs", "Bases de datos"],
  photoUrl: null,
  education: null,
  isAvailable: false,
  orientationTypes: [],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MentorCard", () => {
  it("resalta el área técnica seleccionada", () => {
    render(<MentorCard mentor={mentor} selectedArea="APIs" />);
    const selected = screen.getByText("APIs");
    expect(selected).toHaveAttribute("aria-current", "true");
    expect(selected).toHaveClass("border-accent", "font-semibold", "ring-1", "ring-accent");
    expect(screen.getByText("Backend")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Backend")).toHaveClass("border-accent/15");
  });

  it("no resalta ninguna área cuando no hay selección", () => {
    render(<MentorCard mentor={mentor} />);
    for (const name of mentor.technicalAreas) {
      expect(screen.getByText(name)).not.toHaveAttribute("aria-current");
      expect(screen.getByText(name)).not.toHaveClass("ring-1");
    }
  });

  it("no resalta nada si el mentor no tiene el área seleccionada", () => {
    render(<MentorCard mentor={mentor} selectedArea="QA" />);
    for (const name of mentor.technicalAreas) {
      expect(screen.getByText(name)).not.toHaveAttribute("aria-current");
    }
  });

  it("usa iniciales sin intentar cargar una foto inexistente", () => {
    const imageLoader = vi.spyOn(window, "Image");
    render(<MentorCard mentor={mentor} />);
    expect(screen.getByText("MF")).toBeVisible();
    expect(imageLoader).not.toHaveBeenCalled();
  });

  it("muestra la fotografía real con texto alternativo", async () => {
    vi.spyOn(window, "Image").mockImplementation(function ImageMock() {
      return { complete: true, naturalWidth: 100 } as HTMLImageElement;
    });
    const photoUrl = "https://api.umssy.test/api/mentors/mentor/photo?v=1";
    render(<MentorCard mentor={{ ...mentor, photoUrl }} />);
    expect(await screen.findByRole("img", { name: `Foto de ${mentor.fullName}` }))
      .toHaveAttribute("src", photoUrl);
  });

  it("vuelve a las iniciales si falla la fotografía", async () => {
    vi.spyOn(window, "Image").mockImplementation(function ImageMock() {
      return { complete: true, naturalWidth: 0 } as HTMLImageElement;
    });
    render(<MentorCard mentor={{ ...mentor, photoUrl: "/missing-photo" }} />);
    await waitFor(() => expect(screen.getByText("MF")).toBeVisible());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("muestra formación real y estado disponible", () => {
    render(
      <MentorCard
        mentor={{
          ...mentor,
          education: { degree: "Ingeniería", institution: "UMSS" },
          isAvailable: true,
        }}
      />,
    );
    expect(screen.getByText("Ingeniería · UMSS")).toBeVisible();
    const availability = screen.getByText("Disponible para mentoría");
    expect(availability).toBeVisible();
    expect(availability).toHaveClass("border-border", "text-ink");
    const indicators = availability.parentElement;
    expect(indicators).toHaveClass("ml-auto", "flex-col", "items-end");
    const header = indicators?.parentElement;
    expect(header).toHaveClass("flex-wrap");
    expect(header?.firstElementChild).toContainElement(
      screen.getByRole("heading", { name: mentor.fullName }),
    );
    expect(header?.firstElementChild).toHaveClass("basis-56", "min-w-0");
    expect(header?.lastElementChild).toBe(indicators);
  });

  it("omite formación ausente y muestra disponibilidad explícita", () => {
    render(<MentorCard mentor={mentor} />);
    expect(screen.queryByText(/Ingeniería/)).not.toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.queryByText("Disponible para mentoría")).not.toBeInTheDocument();
  });

  it("depende solo de isAvailable aunque existan tipos de orientación", () => {
    render(
      <MentorCard
        mentor={{ ...mentor, orientationTypes: ["Orientación técnica"] }}
      />,
    );
    expect(screen.getByText("Orientación técnica")).toBeVisible();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("muestra orientaciones reales y conserva un vacío discreto", () => {
    const { rerender } = render(
      <MentorCard
        mentor={{
          ...mentor,
          orientationTypes: ["Orientación técnica", "Revisión de CV"],
        }}
      />,
    );
    expect(screen.getByText("Orientación técnica")).toBeVisible();
    expect(screen.getByText("Revisión de CV")).toBeVisible();
    rerender(<MentorCard mentor={mentor} />);
    expect(screen.getByText("Sin orientaciones registradas")).toBeVisible();
    expect(screen.queryByText("Habilidades")).not.toBeInTheDocument();
  });

  it("conserva textos largos y permite dividir palabras sin espacios", () => {
    const fullName = "Nombre".repeat(30);
    const headline = "Especialidad".repeat(30);
    const orientationType = "Orientación".repeat(30);
    render(
      <MentorCard
        mentor={{ ...mentor, fullName, headline, isAvailable: true, orientationTypes: [orientationType] }}
      />,
    );
    for (const text of [fullName, headline, orientationType]) {
      expect(screen.getByText(text)).toHaveClass("[overflow-wrap:anywhere]");
    }
    expect(screen.getByText("Disponible para mentoría").parentElement).toHaveClass(
      "flex-col",
    );
    expect(screen.getByText("Disponible para mentoría").parentElement?.parentElement).toHaveClass(
      "flex-wrap",
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/mentors/${mentor.id}`,
    );
  });

  it("renderiza la información principal del mentor", () => {
    render(<MentorCard mentor={mentor} />);

    expect(screen.getByText(mentor.fullName)).toBeDefined();
    expect(screen.getByText("Desarrolladora Backend Senior")).toBeDefined();
    expect(screen.getByText("Backend")).toBeDefined();
    expect(screen.getByText("APIs")).toBeDefined();
    expect(screen.getByText("Bases de datos")).toBeDefined();
    expect(screen.queryByText("Disponible")).toBeNull();
    expect(screen.getByText("No disponible")).toBeVisible();
  });

  it("no fabrica un cargo cuando headline es null", () => {
    render(
      <MentorCard
        mentor={{
          ...mentor,
          headline: null,
        }}
      />,
    );

    expect(screen.queryByText("Desarrolladora Backend Senior")).toBeNull();
    expect(screen.queryByText("Cargo no registrado")).toBeNull();
  });

  it("renderiza múltiples áreas técnicas", () => {
    render(<MentorCard mentor={mentor} />);

    expect(screen.getByText("Backend")).toBeDefined();
    expect(screen.getByText("APIs")).toBeDefined();
    expect(screen.getByText("Bases de datos")).toBeDefined();
  });

  it("enlaza el perfil utilizando el ID correcto del mentor", () => {
    render(<MentorCard mentor={mentor} />);

    const profileLink = screen.getByRole("link", {
      name: `Ver perfil de ${mentor.fullName}`,
    });

    expect(profileLink.getAttribute("href")).toBe(
      "/mentors/0424f370-00f0-43cf-9b8a-997af81840b9",
    );
    expect(profileLink).not.toHaveClass("w-full");
    expect(profileLink.parentElement).toHaveClass("justify-end", "mt-auto");
  });

  it("genera la ruta correcta para otro UUID de mentor", () => {
    render(
      <MentorCard
        mentor={{
          ...mentor,
          id: "0fa5e6de-63a4-430e-87fb-22f5eb700ecd",
          fullName: "Carlos Andrés Vargas",
        }}
      />,
    );

    const profileLink = screen.getByRole("link", {
      name: "Ver perfil de Carlos Andrés Vargas",
    });

    expect(profileLink.getAttribute("href")).toBe(
      "/mentors/0fa5e6de-63a4-430e-87fb-22f5eb700ecd",
    );
  });

  it("muestra un mensaje cuando no existen áreas técnicas", () => {
    render(
      <MentorCard
        mentor={{
          ...mentor,
          technicalAreas: [],
          photoUrl: null,
          education: null,
          isAvailable: false,
          orientationTypes: [],
        }}
      />,
    );

    expect(screen.getByText("Sin áreas registradas")).toBeDefined();
  });
  it.each([
    [0, "0 intereses en común"],
    [1, "1 interés en común"],
    [3, "3 intereses en común"],
  ])("muestra %i coincidencias conocidas con gramática correcta", (count, label) => {
    render(
      <MentorCard
        mentor={{ ...mentor, sharedInterestsCount: count }}
        showAffinityBadge
      />,
    );
    expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Ver perfil de ${mentor.fullName}` }))
      .toHaveAttribute("href", `/mentors/${mentor.id}`);
  });

  it("no muestra la insignia de afinidad cuando está deshabilitada", () => {
    render(
      <MentorCard
        mentor={{ ...mentor, sharedInterestsCount: 3 }}
      />,
    );

    expect(screen.queryByText("3 intereses en común")).not.toBeInTheDocument();
  });

  it("no convierte un conteo ausente en cero", () => {
    render(<MentorCard mentor={mentor} showAffinityBadge />);
    expect(screen.queryByText(/intereses? en común/)).not.toBeInTheDocument();
  });
});
