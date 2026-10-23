import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { buildSessionToken, COMPANY_ID, DOCKER, KUBERNETES, PYTHON } from "../testing/vacancy-fixtures";
import { RegisterVacancyView } from "./register-vacancy-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()), apiClient: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
    <div data-testid="select" onClick={() => onValueChange?.("Tiempo completo")}>{children}</div>
  ),
  SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const EXPECTED_PAYLOAD = {
  title: "DevOps Senior",
  description: "Buscamos un DevOps con Docker y Kubernetes.",
  modality: "Híbrido",
  contractType: "Tiempo completo",
  category: "Tecnología",
  positionsAvailable: 2,
  salaryMin: 6500,
  salaryMax: 8000,
  languages: "Español, inglés intermedio",
  locationUrl: "https://maps.app.goo.gl/TechBolivia",
  skillIds: [DOCKER.id, KUBERNETES.id],
};

const CREATED = { data: { statusCode: 201, ok: true, detail: "", data: { id: "offer-1", createdAt: "2026-10-12T00:00:00.000Z" } } };

const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
const type = (id: string, value: string) => fireEvent.change(byId(id), { target: { value } });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

function fillInformation() {
  type("title", "DevOps Senior");
  click("Híbrido");
  type("mapsLink", EXPECTED_PAYLOAD.locationUrl);
  fireEvent.click(screen.getByTestId("select"));
  type("category", "Tecnología");
  type("vacancyCount", "2");
  type("salary", "6500-8000");
  type("languages", "Español, inglés intermedio");
  click("Continuar");
}

async function fillRequirements() {
  await screen.findByRole("button", { name: "Docker" });
  type("description", "Buscamos un DevOps con Docker y Kubernetes.");
  click("Docker");
  click("+ Añadir habilidad");
  fireEvent.change(screen.getByLabelText(/Buscar tecnología/), { target: { value: "kuber" } });
  click("Kubernetes");
  click("Añadir habilidad");
  await waitFor(() => expect(screen.queryByText("Buscar habilidad")).not.toBeInTheDocument());
  click("Continuar");
}

async function goToPreview() {
  fillInformation();
  await fillRequirements();
  await screen.findByText("Revisa tu publicación");
}

describe("Registrar vacante: wizard completo conectado al backend", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    window.history.pushState({}, "", "/vacancies/register");
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    saveAccessToken(buildSessionToken("empresa"));
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { statusCode: 200, ok: true, detail: "", data: [PYTHON, DOCKER, KUBERNETES] },
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it("publica la vacante con el contrato exacto y luego limpia el formulario", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(CREATED);
    renderWithQuery(<RegisterVacancyView />);

    await goToPreview();
    click("Confirmar publicación");

    expect(await screen.findByText("Vacante publicada")).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(`/companies/${COMPANY_ID}/job-offers`, EXPECTED_PAYLOAD);

    click("Publicar otra vacante");
    await waitFor(() => expect(byId("title")).toBeInTheDocument());
    expect(byId("title").value).toBe("");
  });

  it("salir por un enlace del menú con datos pide confirmación antes de navegar", async () => {
    renderWithQuery(<RegisterVacancyView />);
    const link = document.createElement("a");
    link.href = "/profile";
    link.textContent = "Mi perfil";
    document.body.appendChild(link);
    type("title", "DevOps");

    fireEvent.click(link);
    expect(await screen.findByText("¿Salir sin publicar?")).toBeInTheDocument();
    click("Salir");

    expect(push).toHaveBeenCalledWith("/profile");
  });
});