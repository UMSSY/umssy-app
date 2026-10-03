import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mentorsMock } from "../services/mentor-profile.mock";
import { MentorGuidanceTypes } from "./mentor-guidance-types";
import { MentorProfileHeader } from "./mentor-profile-header";
import { MentorTechnicalAreas } from "./mentor-technical-areas";

vi.mock("next/image", () => ({
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean },
  ) => {
    const { fill, ...imageProps } = props;
    void fill;

    return React.createElement("img", imageProps);
  },
}));

describe("Mentor profile components", () => {
  it("muestra mensaje cuando no existen áreas técnicas", () => {
    render(<MentorTechnicalAreas areas={[]} />);

    expect(
      screen.getByText("No hay áreas técnicas registradas."),
    ).toBeInTheDocument();
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

  it("muestra las iniciales cuando el mentor no tiene fotografía", () => {
    render(<MentorProfileHeader mentor={mentorsMock[0]} />);

    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("Intereses profesionales")).toBeInTheDocument();

    expect(screen.getByText("Arquitectura de software")).toBeInTheDocument();

    expect(screen.getByText("Cloud Computing")).toBeInTheDocument();

    expect(screen.getByText("Sistemas distribuidos")).toBeInTheDocument();
    expect(screen.getByText(/Ingeniería de Sistemas/)).toBeInTheDocument();
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
