import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { companyAccessRequestService } from "@/modules/access-requests";
import { CompanyRequestDetailView } from "./company-request-detail-view";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/modules/access-requests", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/access-requests")>();
  return {
    ...actual,
    companyAccessRequestService: {
      ...actual.companyAccessRequestService,
      getDetail: vi.fn(),
      getDocumentBlob: vi.fn(),
      getLogoBlob: vi.fn(),
    },
  };
});

const SAMPLE_DETAIL = {
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
  logoFileId: "logo-1",
  documentFileId: "doc-1",
  approvedCompanyId: null,
  status: { id: "st-1", title: "PENDING" },
  city: { id: "city-1", name: "Cochabamba" },
};

describe("CompanyRequestDetailView", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(companyAccessRequestService.getDetail).mockResolvedValue({
      ok: true,
      data: SAMPLE_DETAIL,
    });
  });

  it("finishes loading and displays inline attachment errors if downloads fail", async () => {
    vi.mocked(companyAccessRequestService.getDocumentBlob).mockRejectedValue(
      new Error("No se pudo descargar la carta membretada adjunta."),
    );
    vi.mocked(companyAccessRequestService.getLogoBlob).mockRejectedValue(
      new Error("No se pudo descargar el logotipo adjunto."),
    );

    render(<CompanyRequestDetailView id="comp-req-1" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Tech Bolivia S.R.L." }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.queryByText(/cargando expediente de la solicitud/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("No se pudo descargar la carta membretada adjunta."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo descargar el logotipo adjunto."),
    ).toBeInTheDocument();
  });

  it("stacks resolution actions vertically on mobile inside dialog footer", async () => {
    vi.mocked(companyAccessRequestService.getDocumentBlob).mockResolvedValue(
      null,
    );
    vi.mocked(companyAccessRequestService.getLogoBlob).mockResolvedValue(null);

    const user = userEvent.setup();
    render(<CompanyRequestDetailView id="comp-req-1" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Tech Bolivia S.R.L." }),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: /emitir resolución/i }),
    );

    const approveButton = screen.getByRole("button", { name: "Aprobar" });
    const footerActions = approveButton.parentElement;
    expect(footerActions?.className).toContain("flex-col");
    expect(footerActions?.className).toContain("sm:flex-row");
  });
});
