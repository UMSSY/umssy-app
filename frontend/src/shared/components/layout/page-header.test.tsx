import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

const BREADCRUMB = [
  { label: "Mi perfil", href: "/profile" },
  { label: "Radar de afinidad" },
];

afterEach(() => {
  cleanup();
});

describe("PageHeader", () => {
  it("renders the title as h1", () => {
    render(<PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad" />);

    expect(screen.getByRole("heading", { level: 1, name: "Radar de afinidad" })).toBeDefined();
  });

  it("marks the last breadcrumb item as the current page with aria-current", () => {
    render(<PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad" />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const currentItem = within(nav).getByText("Radar de afinidad");

    expect(currentItem.getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByText("Mi perfil").getAttribute("aria-current")).toBeNull();
  });

  it("renders a link for breadcrumb items with href", () => {
    render(<PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad" />);

    const link = screen.getByRole("link", { name: "Mi perfil" });
    expect(link.getAttribute("href")).toBe("/profile");
  });

  it("renders the actions slot to the right", () => {
    render(
      <PageHeader
        breadcrumb={BREADCRUMB}
        title="Radar de afinidad"
        actions={<button type="button">Exportar</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Exportar" })).toBeDefined();
  });

  it("renders the children below the title row", () => {
    render(
      <PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad">
        <p>Fila extra</p>
      </PageHeader>,
    );

    expect(screen.getByText("Fila extra")).toBeDefined();
  });

  it("does not render the children slot when empty", () => {
    const { container } = render(
      <PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad" />,
    );

    expect(container.querySelector(".border-t")).toBeNull();
  });

  it("renders separators between breadcrumb items", () => {
    render(<PageHeader breadcrumb={BREADCRUMB} title="Radar de afinidad" />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByText("›")).toBeDefined();
  });
});
