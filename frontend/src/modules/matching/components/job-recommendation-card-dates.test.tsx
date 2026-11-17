import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JobRecommendationCard } from "./job-recommendation-card";
import type { RecommendedJob } from "../types/recommended-job.types";

const job: RecommendedJob = {
  jobOfferId: "123",
  title: "Desarrollador Full Stack",
  companyName: "Empresa de prueba",
  modality: "Remoto",
  locationUrl: "https://maps.app.goo.gl/abc123",
  publishedAt: "2026-11-10T15:00:00.000Z",
  expiresAt: "2026-11-29T15:00:00.000Z",
  score: 85,
  matchedSkills: ["React"],
  skills: ["React", "PostgreSQL"],
};

afterEach(cleanup);

describe("JobRecommendationCard - fechas y estilo de vacante", () => {
  it("muestra la fecha de publicación y la de expiración como en Todas las vacantes", () => {
    render(<JobRecommendationCard job={job} />);

    expect(screen.getByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Expira: 29/11/2026")).toBeInTheDocument();
  });

  it("no muestra la expiración cuando la vacante no vence", () => {
    render(<JobRecommendationCard job={{ ...job, expiresAt: null }} />);

    expect(screen.getByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.queryByText(/Expira:/)).toBeNull();
  });

  it("usa el borde azul de las vacantes al pasar el puntero o enfocar", () => {
    const { container } = render(<JobRecommendationCard job={job} />);

    expect(container.firstElementChild).toHaveClass(
      "hover:border-availability-border",
      "focus-within:border-availability-border",
    );
  });
});
