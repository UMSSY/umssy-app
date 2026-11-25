import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CompanyAccessRequestItem } from "@/modules/access-requests";
import { CompanyRequestTable } from "./company-request-table";

const SAMPLE_ITEMS: CompanyAccessRequestItem[] = [
  {
    id: "comp-req-1",
    requestCode: "EMP-2026-001",
    companyName: "Tech Bolivia S.R.L.",
    sector: "Tecnología",
    description: "Desarrollo de software empresarial.",
    email: "contacto@techbo.example",
    phone: "70011223",
    websiteUrl: "https://techbo.example",
    username: "techbo",
    submittedAt: "2026-11-24T12:00:00.000Z",
    reviewedAt: null,
    rejectionReason: null,
    ocrMatchScore: 85,
    ocrFieldResults: null,
    logoFileId: null,
    documentFileId: "doc-1",
    approvedCompanyId: null,
    status: { id: "st-1", title: "PENDING" },
    city: { id: "city-1", name: "Cochabamba" },
  },
];

describe("CompanyRequestTable", () => {
  it("renders table rows with company metadata and review link", () => {
    render(<CompanyRequestTable items={SAMPLE_ITEMS} />);

    expect(screen.getByText("Tech Bolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByText("EMP-2026-001")).toBeInTheDocument();
    expect(screen.getByText("85% coincidencia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar" })).toHaveAttribute(
      "href",
      "/backoffice/empresas/comp-req-1",
    );
  });

  it("renders skeleton placeholders while loading", () => {
    render(<CompanyRequestTable items={[]} isLoading />);
    expect(
      screen.getAllByTestId("company-request-skeleton-row").length,
    ).toBeGreaterThan(0);
  });
});

describe("CompanyRequestTable: tarjetas por ancho del contenedor", () => {
  afterEach(() => cleanup());

  it("mide el espacio del contenedor y no el de la pantalla", () => {
    const { container } = render(<CompanyRequestTable items={SAMPLE_ITEMS} />);

    expect(container.firstElementChild).toHaveClass("@container/companies", "min-w-0");
    expect(container.querySelector("table")).toHaveClass(
      "min-w-[960px]",
      "table-fixed",
      "@max-[60rem]/companies:block",
      "@max-[60rem]/companies:min-w-0",
    );
  });

  it("no depende de los puntos de corte de la pantalla", () => {
    const { container } = render(<CompanyRequestTable items={SAMPLE_ITEMS} />);
    const withViewportBreakpoint = [...container.querySelectorAll("*")].filter((element) =>
      element.getAttribute("class")?.includes("max-md:"),
    );

    expect(withViewportBreakpoint).toHaveLength(0);
  });

  it("oculta los encabezados y muestra cada fila como tarjeta cuando falta espacio", () => {
    render(<CompanyRequestTable items={SAMPLE_ITEMS} />);

    expect(screen.getAllByRole("rowgroup")[0]).toHaveClass("@max-[60rem]/companies:hidden");
    expect(screen.getAllByRole("rowgroup")[1]).toHaveClass("@max-[60rem]/companies:block");
    expect(screen.getAllByRole("row")[1]).toHaveClass(
      "@max-[60rem]/companies:grid",
      "@max-[60rem]/companies:grid-cols-2",
    );
  });

  it("cada dato de la tarjeta lleva el nombre de su columna", () => {
    render(<CompanyRequestTable items={SAMPLE_ITEMS} />);

    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");

    expect(cells.map((cell) => cell.getAttribute("data-label"))).toEqual([
      null,
      "Código",
      "Rubro",
      "Documento",
      "Estado",
      "Coincidencia",
      null,
    ]);
    expect(cells[1]).toHaveClass("@max-[60rem]/companies:block", "@max-[60rem]/companies:before:content-[attr(data-label)]");
  });

  it("el botón Revisar queda dentro de la tarjeta y ocupa todo el ancho", () => {
    render(<CompanyRequestTable items={SAMPLE_ITEMS} />);

    const review = screen.getByRole("link", { name: "Revisar" });

    expect(within(screen.getAllByRole("row")[1]).getByRole("link", { name: "Revisar" })).toBe(review);
    expect(review.className).toContain("@max-[60rem]/companies:w-full");
  });

  it("los esqueletos de carga también se convierten en tarjetas", () => {
    render(<CompanyRequestTable items={[]} isLoading />);

    expect(screen.getAllByTestId("company-request-skeleton-row")[0]).toHaveClass("@max-[60rem]/companies:block");
  });
});
