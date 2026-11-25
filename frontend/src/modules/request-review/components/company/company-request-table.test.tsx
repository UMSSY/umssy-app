import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
