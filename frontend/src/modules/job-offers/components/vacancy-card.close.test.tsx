import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JobOffer } from "../types/job-offer.types";
import { VacancyCard } from "./vacancy-card";

const publishedOffer = {
  id: "offer-1",
  title: "Desarrollador Full Stack",
  description: "Vacante de desarrollo",
  category: "Tecnología",
  modality: "Remoto",
  contractType: "Tiempo completo",
  status: "Publicada",
  positionsAvailable: 2,
  salaryRange: "A convenir",
  languages: "Español",
  locationUrl: "https://maps.app.goo.gl/TechBolivia",
  expiresAt: null,
  publishedAt: "2026-11-19T12:00:00.000Z",
  createdAt: "2026-11-19T12:00:00.000Z",
  company: {
    id: "company-1",
    name: "TechBolivia",
  },
  skills: [],
  applicantsCount: 0,
} as JobOffer;

afterEach(() => {
  cleanup();
});

describe("VacancyCard - cerrar vacante", () => {
  it("muestra el botón Cerrar junto al botón de eliminación", () => {
    render(
      <VacancyCard
        offer={publishedOffer}
        onDetails={vi.fn()}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const closeButton = screen.getByRole("button", {
      name: "Cerrar vacante Desarrollador Full Stack",
    });

    const deleteButton = screen.getByRole("button", {
      name: "Eliminar vacante Desarrollador Full Stack",
    });

    expect(closeButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    expect(closeButton.parentElement).toBe(
      deleteButton.parentElement,
    );

    expect(closeButton).toHaveClass("cursor-pointer");
    expect(closeButton).toHaveClass("bg-blue-600");
    expect(closeButton).toHaveClass("hover:bg-blue-700");
  });

  it("identifica correctamente la vacante seleccionada", () => {
    const onClose = vi.fn();

    render(
      <VacancyCard
        offer={publishedOffer}
        onDetails={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cerrar vacante Desarrollador Full Stack",
      }),
    );

    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledWith(publishedOffer);
  });

  it.each(["Cerrada", "Eliminada"])(
    "no muestra Cerrar cuando el estado es %s",
    (status) => {
      render(
        <VacancyCard
          offer={{ ...publishedOffer, status }}
          onDetails={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("button", {
          name: /Cerrar vacante/i,
        }),
      ).not.toBeInTheDocument();
    },
  );

  it("no muestra un botón sin acción de cierre", () => {
    render(
      <VacancyCard
        offer={publishedOffer}
        onDetails={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: /Cerrar vacante/i,
      }),
    ).not.toBeInTheDocument();
  });
});