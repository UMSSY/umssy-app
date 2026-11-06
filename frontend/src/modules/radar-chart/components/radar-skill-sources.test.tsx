import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { documentsService } from "@/modules/documents";
import { certificationsService, useCertifications } from "@/modules/certifications";
import { RadarSkillSources } from "./radar-skill-sources";
import type { Epic2Skill } from "../types/epic2-skill.types";
vi.mock("@/modules/documents", () => ({ documentsService: { getCvs: vi.fn() } }));
vi.mock("@/modules/certifications/services/certifications.service", () => ({ certificationsService: { getCertifications: vi.fn() } }));
function show(refs: Epic2Skill["evidenceRefs"]) {
  const skill: Epic2Skill = { id: "skill-secret", name: "Python", text: "Python", source: "nlp", areaId: "data-ai", verificationStatus: "approved", isHighRelevance: false, evidenceRefs: refs };
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RadarSkillSources userId="owner" skills={[skill]} /></QueryClientProvider>);
}
function page(items: Array<{ id: string; fileName: string }>, current = 1, pages = 1) {
  return { items: items.map(item => ({ ...item, fileType: "application/pdf", sizeInBytes: 10, updatedAt: new Date(), isCurrent: current === 1 })), totalItems: items.length, page: current, totalPages: pages };
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe("Nombres de documentos del radar", () => {
  it("busca el CV vinculado en el historial sin mostrar IDs ni otro documento", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValueOnce(page([{ id: "new", fileName: "Otro.pdf" }], 1, 2)).mockResolvedValueOnce(page([{ id: "cv-secret", fileName: "CV Alexander Tapia.pdf" }], 2, 2));
    show([{ type: "cv", id: "cv-secret" }]);
    expect(await screen.findByText("CV Alexander Tapia.pdf")).toBeInTheDocument();
    expect(documentsService.getCvs).toHaveBeenNthCalledWith(2, 2, 10);
    expect(screen.queryByText("Otro.pdf")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("cv-secret");
  });
  it("muestra varios nombres arbitrarios y elimina referencias duplicadas", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(page([{ id: "a", fileName: "Mi CV 2026.pdf" }, { id: "b", fileName: "Résumé profesional.pdf" }]));
    show([{ type: "cv", id: "a" }, { type: "cv", id: "a" }, { type: "cv", id: "b" }]);
    expect(await screen.findByText("Mi CV 2026.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("Mi CV 2026.pdf")).toHaveLength(1);
    expect(screen.getByText("Résumé profesional.pdf")).toBeInTheDocument();
  });
  it("usa el nombre del archivo de certificación", async () => {
    vi.mocked(certificationsService.getCertifications).mockResolvedValue([{ id: "cert-id", name: "Curso Python", issuingOrganization: "UMSS", issueDate: "2026-01-01", createdAt: "", updatedAt: "", document: { fileName: "Diploma Python.pdf", mimeType: "application/pdf", sizeBytes: 1, uploadedAt: "" } }]);
    show([{ type: "certification", id: "cert-id" }]);
    expect(await screen.findByText("Diploma Python.pdf")).toBeInTheDocument();
    expect(documentsService.getCvs).not.toHaveBeenCalled();
  });
  it("reutiliza la misma consulta de certificaciones entre componentes", async () => {
    const certification = {
      id: "cert-shared", name: "Curso compartido", issuingOrganization: "UMSS",
      issueDate: "2026-01-01", createdAt: "", updatedAt: "",
      document: { fileName: "Diploma compartido.pdf", mimeType: "application/pdf", sizeBytes: 1, uploadedAt: "" },
    };
    vi.mocked(certificationsService.getCertifications).mockResolvedValue([certification]);
    const skill: Epic2Skill = {
      id: "skill-shared", name: "Python", text: "Python", source: "nlp",
      areaId: "data-ai", verificationStatus: "approved", isHighRelevance: false,
      evidenceRefs: [{ type: "certification", id: "cert-shared" }],
    };
    function OtherConsumer() {
      const { certifications } = useCertifications();
      return <p>Certificaciones compartidas: {certifications.length}</p>;
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <OtherConsumer />
        <RadarSkillSources userId="owner" skills={[skill]} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Diploma compartido.pdf")).toBeInTheDocument();
    expect(screen.getByText("Certificaciones compartidas: 1")).toBeInTheDocument();
    expect(certificationsService.getCertifications).toHaveBeenCalledTimes(1);
  });
  it("no inventa nombres para documentos eliminados", async () => {
    vi.mocked(documentsService.getCvs).mockResolvedValue(page([]));
    show([{ type: "cv", id: "deleted-id" }]);
    expect(await screen.findByText("CV de origen no disponible")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("deleted-id");
  });
  it("permite reintentar una consulta fallida", async () => {
    vi.mocked(documentsService.getCvs).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(page([{ id: "a", fileName: "Recuperado.pdf" }]));
    show([{ type: "cv", id: "a" }]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Tus puntuaciones se conservan");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar documentos" }));
    expect(await screen.findByText("Recuperado.pdf")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });
  it("no consulta documentos si no hay referencias", () => {
    show([]);
    expect(screen.getByText("Sin documento de origen asociado")).toBeInTheDocument();
    expect(documentsService.getCvs).not.toHaveBeenCalled();
    expect(certificationsService.getCertifications).not.toHaveBeenCalled();
  });
});
