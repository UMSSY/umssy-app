import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mentorsMock } from "../../services/mentor-profile.mock";
import { MentorGuidanceTypes } from "./mentor-guidance-types";
import { MentorProfileHeader } from "./mentor-profile-header";
import { MentorTechnicalAreas } from "./mentor-technical-areas";
import { MentorProfileNavigation } from "./mentor-profile-navigation";

vi.mock("next/image", () => ({
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean },
  ) => {
    const { fill, ...imageProps } = props;
    void fill;

    return React.createElement("img", imageProps);
  },
}));
afterEach(() => {
  cleanup();
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
    const { container } = render(<MentorGuidanceTypes guidanceTypes={[]} />);

    expect(
      screen.getByText("Este mentor todavía no registró tipos de orientación."),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="toggle-group"]'),
    ).not.toBeInTheDocument();
  });

  it("muestra los tipos de orientación registrados", () => {
    render(
      <MentorGuidanceTypes guidanceTypes={mentorsMock[0].guidanceTypes} />,
    );

    expect(screen.getByText("Revisión de CV")).toBeInTheDocument();
    expect(screen.getByText("Orientación técnica")).toBeInTheDocument();
  });

  it("actualiza la descripción al seleccionar un tipo de orientación", () => {
    const { container } = render(
      <MentorGuidanceTypes guidanceTypes={mentorsMock[0].guidanceTypes} />,
    );

    const reviewCvOption = screen.getByRole("button", {
      name: "Revisión de CV",
    });
    const technicalGuidanceOption = screen.getByRole("button", {
      name: "Orientación técnica",
    });

    expect(container.querySelector('[data-slot="toggle-group"]')).toHaveAttribute(
      "aria-label",
      "Tipos de orientación",
    );
    expect(reviewCvOption).toHaveAttribute("data-slot", "toggle-group-item");
    expect(reviewCvOption).toHaveAttribute("aria-pressed", "true");
    expect(technicalGuidanceOption).toHaveAttribute("aria-pressed", "false");

    expect(
      screen.getByText(
        "Orientación para mejorar hojas de vida enfocadas en roles tecnológicos.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(technicalGuidanceOption);

    expect(reviewCvOption).toHaveAttribute("aria-pressed", "false");
    expect(technicalGuidanceOption).toHaveAttribute("aria-pressed", "true");

    expect(
      screen.getByText(
        "Asesoramiento sobre arquitectura de software, patrones de diseño y preparación técnica.",
      ),
    ).toBeInTheDocument();
  });

  it("muestra las iniciales cuando el mentor no tiene fotografía", () => {
    render(<MentorProfileHeader mentor={mentorsMock[0]} />);

    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("Intereses profesionales")).toBeInTheDocument();
    expect(screen.getByText("Arquitectura de software")).toBeInTheDocument();
    expect(screen.getByText("Cloud Computing")).toBeInTheDocument();
    expect(screen.getByText("Sistemas distribuidos")).toBeInTheDocument();
    expect(screen.getByText(/Ingeniería de Sistemas/)).toBeInTheDocument();
  });

  it("habilita solicitar mentoría cuando el mentor está disponible", () => {
    render(<MentorProfileHeader mentor={mentorsMock[0]} />);

    expect(screen.getByText("Disponible para mentoría")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Solicitar mentoría",
      }),
    ).toBeEnabled();
  });

  it("deshabilita solicitar mentoría cuando el mentor no está disponible", () => {
    render(<MentorProfileHeader mentor={mentorsMock[1]} />);

    expect(screen.getByText("No disponible")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Solicitar mentoría",
      }),
    ).toBeDisabled();
  });

  it("muestra la fotografía cuando el mentor tiene una imagen", () => {
    const mentorWithImage = {
      ...mentorsMock[0],
      profileImage: "/mentor-test.jpg",
    };

    render(<MentorProfileHeader mentor={mentorWithImage} />);

    expect(
      screen.getByRole("img", {
        name: `Foto de ${mentorWithImage.name}`,
      }),
    ).toBeInTheDocument();
  });
});
