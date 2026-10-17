import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jobMatchingService } from "@/modules/matching/services/job-matching.service";
import type { RecommendationsResult } from "@/modules/matching";

import JobsPage from "./page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderPage(result: RecommendationsResult) {
  vi.spyOn(jobMatchingService, "getRecommendations").mockResolvedValue(result);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <JobsPage />
    </QueryClientProvider>,
  );
}

describe("JobsPage", () => {
  it("muestra las vacantes recomendadas con su compatibilidad", async () => {
    renderPage({
      isProfileComplete: true,
      items: [
        {
          jobOfferId: "o1",
          title: "Desarrollador Backend",
          companyName: "Empresa SA",
          modality: "Remoto",
          score: 67,
          matchedSkills: ["Python"],
          matchedSkillIds: ["s1"],
          missingSkills: ["Docker"],
          missingSkillIds: ["s2"],
          skills: ["Python", "Docker"],
        },
      ],
    });

    expect(screen.getByRole("heading", { name: "Vacantes para ti" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Desarrollador Backend" })).toBeInTheDocument();
    expect(screen.getByText("67% afinidad")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });

  it("invita a completar el perfil cuando no hay habilidades", async () => {
    renderPage({ isProfileComplete: false, items: [] });

    expect(
      await screen.findByRole("heading", { name: "Aún no podemos calcular tu afinidad" }),
    ).toBeInTheDocument();
  });

  it("muestra el estado sin coincidencias cuando ninguna vacante encaja", async () => {
    renderPage({ isProfileComplete: true, items: [] });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Por ahora no hay vacantes que coincidan con tu perfil" }),
      ).toBeInTheDocument(),
    );
  });
});
