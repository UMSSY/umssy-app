import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JOB_MATCHING_MESSAGES } from "../constants/job-matching.constants";
import type { CategorizedJobRequirement } from "../types/requirement-category.types";
import { MissingRequirements } from "./missing-requirements";

const NO_PENDING = "No tienes habilidades ni requisitos visibles pendientes para esta oportunidad";

const MIXED: CategorizedJobRequirement[] = [
  { name: "Docker", status: "Cumple", category: "skill" },
  { name: "Kubernetes", status: "Pendiente", category: "skill" },
  { name: "Ingeniería de Sistemas", status: "Pendiente", category: "academic" },
  { name: "Carta de motivación", status: "Pendiente", category: "other" },
];

describe("MissingRequirements", () => {
  afterEach(cleanup);

  it("shows Coincide and Falta instead of the API status values", () => {
    render(<MissingRequirements requirements={MIXED} />);

    expect(screen.getByText("Coincide")).toBeInTheDocument();
    expect(screen.getAllByText("Falta")).toHaveLength(2);
    expect(screen.queryByText("Cumple")).not.toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("pairs every status with an icon and text, not only with color", () => {
    const { container } = render(<MissingRequirements requirements={MIXED} />);

    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(3);
  });

  it("shows skills and other requirements without academic requirements", () => {
    render(<MissingRequirements requirements={MIXED} />);

    const headings = screen.getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Habilidades", "Otros requisitos"]);
    expect(screen.queryByText("Ingeniería de Sistemas")).not.toBeInTheDocument();

    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(2);
    expect(within(lists[0]).getByText("Docker")).toBeInTheDocument();
    expect(within(lists[0]).getByText("Kubernetes")).toBeInTheDocument();
    expect(within(lists[1]).getByText("Carta de motivación")).toBeInTheDocument();
    expect(within(lists[1]).getByText("Falta")).toBeInTheDocument();
  });

  it("shows only the groups that have requirements", () => {
    render(
      <MissingRequirements
        requirements={[{ name: "Docker", status: "Cumple", category: "skill" }]}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Habilidades", level: 4 })).toBeInTheDocument();
  });

  it("shows a single list without group titles when the requirements have no category", () => {
    render(
      <MissingRequirements
        requirements={[
          { name: "Docker", status: "Cumple" },
          { name: "Kubernetes", status: "Pendiente" },
        ]}
      />,
    );

    expect(screen.queryByRole("heading", { level: 4 })).not.toBeInTheDocument();
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("does not show the zero-gap message while something is missing", () => {
    render(<MissingRequirements requirements={MIXED} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(NO_PENDING)).not.toBeInTheDocument();
  });

  it("shows the zero-gap message when every requirement matches", () => {
    render(
      <MissingRequirements
        requirements={[
          { name: "Docker", status: "Cumple", category: "skill" },
          { name: "Ingeniería de Sistemas", status: "Cumple", category: "academic" },
        ]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(NO_PENDING);
    expect(screen.queryByText("Falta")).not.toBeInTheDocument();
    expect(screen.getAllByText("Coincide")).toHaveLength(1);
  });

  it("shows the zero-gap message and no list when the vacancy has no requirements", () => {
    render(<MissingRequirements requirements={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent(NO_PENDING);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("uses the approved zero-gap text from the shared constants", () => {
    expect(JOB_MATCHING_MESSAGES.noPendingRequirements).toBe(NO_PENDING);
  });

  it("renders the default and a custom title", () => {
    const { rerender } = render(<MissingRequirements requirements={MIXED} />);
    expect(screen.getByRole("heading", { name: "Requisitos vs. tu perfil", level: 3 })).toBeInTheDocument();

    rerender(<MissingRequirements requirements={MIXED} title="Lo que te falta" />);
    expect(screen.getByRole("heading", { name: "Lo que te falta", level: 3 })).toBeInTheDocument();
  });

  it("keeps requirements with the same name in different groups", () => {
    render(
      <MissingRequirements
        requirements={[
          { name: "Inglés", status: "Cumple", category: "skill" },
          { name: "Inglés", status: "Pendiente", category: "other" },
        ]}
      />,
    );

    expect(screen.getAllByText("Inglés")).toHaveLength(2);
  });
});
