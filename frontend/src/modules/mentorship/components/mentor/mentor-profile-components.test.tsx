import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mentorsMock } from "../../services/mentor-profile.mock";
import { MentorGuidanceTypes } from "./mentor-guidance-types";
import { MentorProfileHeader } from "./mentor-profile-header";
import { MentorTechnicalAreas } from "./mentor-technical-areas";
import { MentorProfileNavigation } from "./mentor-profile-navigation";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Mentor profile components", () => {
  it("muestra mensaje cuando no existen áreas técnicas", () => {
    render(<MentorTechnicalAreas areas={[]} />);

    expect(
      screen.getByText("No hay áreas técnicas registradas."),
    ).toBeInTheDocument();
  });
  it("permite volver al directorio de mentores", () => {
    render(<MentorProfileNavigation mentorName="Ana Rojas" />);

    const backLink = screen.getByRole("link", {
      name: "Volver al directorio",
    });

    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/mentorship/mentors");
  });

  it("muestra todas las áreas técnicas", () => {
    render(
      <MentorTechnicalAreas areas={["Backend", "Arquitectura", "Cloud"]} />,
    );

    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Arquitectura")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no existen tipos de orientación", () => {
    render(<MentorGuidanceTypes guidanceTypes={[]} />);

    expect(
      screen.getByText("Este mentor todavía no registró tipos de orientación."),
    ).toBeInTheDocument();
  });

  it("muestra los tipos de orientación registrados", () => {
    render(
      <MentorGuidanceTypes guidanceTypes={mentorsMock[0].guidanceTypes} />,
    );

    expect(screen.getByText("Revisión de CV")).toBeInTheDocument();
    expect(screen.getByText("Orientación técnica")).toBeInTheDocument();
  });

  it("actualiza la descripción al seleccionar un tipo de orientación", () => {
    render(
      <MentorGuidanceTypes guidanceTypes={mentorsMock[0].guidanceTypes} />,
    );

    expect(
      screen.getByText(
        "Orientación para mejorar hojas de vida enfocadas en roles tecnológicos.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Orientación técnica",
      }),
    );

    expect(
      screen.getByText(
        "Asesoramiento sobre arquitectura de software, patrones de diseño y preparación técnica.",
      ),
    ).toBeInTheDocument();
  });

  it("muestra las iniciales cuando el mentor no tiene fotografía", () => {
    const { container } = render(
      <MentorProfileHeader mentor={mentorsMock[0]} />,
    );

    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="avatar-fallback"]'),
    ).toHaveTextContent("AR");
    expect(screen.getByText("Intereses profesionales")).toBeInTheDocument();
    expect(screen.getByText("Arquitectura de software")).toBeInTheDocument();
    expect(screen.getByText("Cloud Computing")).toBeInTheDocument();
    expect(screen.getByText("Sistemas distribuidos")).toBeInTheDocument();
    expect(screen.getByText(/Ingeniería de Sistemas/)).toBeInTheDocument();
  });

  it("habilita solicitar mentoría cuando el mentor está disponible", () => {
    const { container } = render(
      <MentorProfileHeader mentor={mentorsMock[0]} />,
    );

    const availabilityBadge = screen.getByText("Disponible para mentoría");
    expect(availabilityBadge).toHaveAttribute("data-slot", "badge");
    expect(availabilityBadge).toHaveClass("text-emerald-700");
    expect(container.querySelector('[data-slot="avatar-badge"]')).toHaveClass(
      "bg-emerald-600",
    );

    expect(
      screen.getByRole("button", {
        name: "Solicitar mentoría",
      }),
    ).toBeEnabled();
  });

  it("deshabilita solicitar mentoría cuando el mentor no está disponible", () => {
    const { container } = render(
      <MentorProfileHeader mentor={mentorsMock[1]} />,
    );

    const availabilityBadge = screen.getByText("No disponible");
    expect(availabilityBadge).toHaveAttribute("data-slot", "badge");
    expect(availabilityBadge).toHaveClass("text-destructive");
    expect(container.querySelector('[data-slot="avatar-badge"]')).toHaveClass(
      "bg-destructive",
    );

    expect(
      screen.getByRole("button", {
        name: "Solicitar mentoría",
      }),
    ).toBeDisabled();
  });

  it("muestra la fotografía cuando el mentor tiene una imagen", async () => {
    const mentorWithImage = {
      ...mentorsMock[0],
      profileImage: "/mentor-test.jpg",
    };

    vi.spyOn(window, "Image").mockImplementation(function ImageMock() {
      return {
        complete: true,
        naturalWidth: 100,
      } as HTMLImageElement;
    });

    const { container } = render(
      <MentorProfileHeader mentor={mentorWithImage} />,
    );

    const image = await screen.findByRole("img", {
      name: `Foto de ${mentorWithImage.name}`,
    });
    expect(image).toHaveAttribute("src", "/mentor-test.jpg");
    expect(image).toHaveAttribute("data-slot", "avatar-image");
    expect(container.querySelector('[data-slot="avatar"]')).toContainElement(
      image,
    );
  });
});
