import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildJob } from "../testing/job-fixtures";
import { JobRecommendationCard } from "./job-recommendation-card";

afterEach(() => {
  cleanup();
});

describe("JobRecommendationCard", () => {
  it("muestra título, empresa y modalidad", () => {
    render(<JobRecommendationCard job={buildJob()} />);

    expect(screen.getByRole("heading", { name: "Desarrollador Backend" })).toBeInTheDocument();
    expect(screen.getByText("Empresa SA · Remoto")).toBeInTheDocument();
  });

  it("muestra el porcentaje con el texto afinidad", () => {
    render(<JobRecommendationCard job={buildJob({ score: 67 })} />);

    expect(screen.getByText("67% afinidad")).toBeInTheDocument();
  });

  it("usa el mismo estilo para cualquier rango de afinidad, sin colores de semáforo", () => {
    const classesFor = (score: number) => {
      const { unmount } = render(<JobRecommendationCard job={buildJob({ score })} />);
      const className = screen.getByText(`${score}% afinidad`).className;
      unmount();
      return className;
    };

    const high = classesFor(90);
    const medium = classesFor(60);
    const low = classesFor(30);

    expect(high).toBe(medium);
    expect(medium).toBe(low);
    expect(high).toContain("text-ink");
    expect(high).toContain("font-bold");
    expect(high).not.toMatch(/green|amber|emerald|yellow|red|bg-/);
  });

  it("muestra los requisitos que coinciden con icono y los que faltan en otro estilo", () => {
    render(<JobRecommendationCard job={buildJob()} />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Python coincide",
      "Docker coincide",
      "React no está en tu perfil",
    ]);
    expect(items[0]?.querySelector("svg")).toBeInTheDocument();
    expect(items[0]?.firstElementChild?.className).toContain("text-ink");
    expect(items[2]?.firstElementChild?.className).toContain("text-text-secondary");
    expect(items[2]?.firstElementChild?.className).not.toMatch(/(text|bg)-(red|danger|destructive)/);
  });

  it("muestra la sección Coincide contigo y el enlace a la vacante", () => {
    render(<JobRecommendationCard job={buildJob({ jobOfferId: "abc" })} />);

    expect(screen.getByText("Coincide contigo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver vacante/ })).toHaveAttribute("href", "/jobs/abc");
  });

  it("no rompe cuando la vacante no tiene habilidades", () => {
    render(
      <JobRecommendationCard
        job={buildJob({ matchedSkills: [], missingSkills: [], skills: [], score: 0 })}
      />,
    );

    expect(screen.getByText("0% afinidad")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
