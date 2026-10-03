import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MentorDirectoryItem } from "../types/mentor-directory.types";
import { MentorDirectoryGrid } from "./mentor-directory-grid";

const mentors: MentorDirectoryItem[] = [
  {
    id: "1",
    fullName: "Mentor Uno",
    jobTitle: "Backend Developer",
    technicalAreas: ["Backend"],
    isAvailable: true,
  },
  {
    id: "2",
    fullName: "Mentor Dos",
    jobTitle: "QA Engineer",
    technicalAreas: ["QA"],
    isAvailable: false,
  },
];

afterEach(cleanup);

describe("MentorDirectoryGrid", () => {
  it("renderiza el directorio cargado cuando isLoading es false", () => {
    render(<MentorDirectoryGrid mentors={mentors} isLoading={false} />);

    expect(screen.getByText("Mentor Uno")).toBeDefined();
    expect(screen.getByText("Mentor Dos")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renderiza skeletons y oculta las tarjetas mientras carga", () => {
    render(<MentorDirectoryGrid mentors={mentors} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando mentores...",
    );
    expect(screen.getAllByTestId("mentor-card-skeleton")).toHaveLength(6);
    expect(screen.queryByText("Mentor Uno")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("mantiene el grid responsive durante la carga", () => {
    render(<MentorDirectoryGrid mentors={mentors} isLoading />);

    const grid = screen.getByRole("region", {
      name: "Listado de mentores",
    });

    expect(grid).toHaveAttribute("aria-busy", "true");
    expect(grid).toHaveClass(
      "grid",
      "grid-cols-1",
      "md:grid-cols-2",
      "xl:grid-cols-3",
    );
  });

  it("renderiza un solo mentor", () => {
    render(<MentorDirectoryGrid mentors={[mentors[0]]} />);

    expect(screen.getByText("Mentor Uno")).toBeDefined();
    expect(screen.queryByText("Mentor Dos")).toBeNull();
  });

  it("tolera un arreglo vacío sin renderizar enlaces", () => {
    render(<MentorDirectoryGrid mentors={[]} />);

    expect(screen.queryByRole("link")).toBeNull();
  });
});
