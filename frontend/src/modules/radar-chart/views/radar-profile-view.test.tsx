import { cloneElement, type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "@/app/(app)/layout";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { mapPublishedRadar } from "../mappers/radar-published.mapper";
import { useLiveRadar } from "../hooks/use-live-radar";
import { RadarProfileView } from "./radar-profile-view";

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile/radar",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();
  return { ...actual, SessionUserCard: () => null };
});
vi.mock("../hooks/use-live-radar", () => ({ useLiveRadar: vi.fn() }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) =>
      cloneElement(children, { width: 600, height: 440 }),
  };
});

const source = {
  userId: "person-1", status: "ready" as const, version: 1,
  updatedAt: "2026-10-25T08:00:00Z", dictionaryVersion: "1", skills: [],
};

const mockHook = vi.mocked(useLiveRadar);
function setRadar(override: Partial<ReturnType<typeof useLiveRadar>> = {}) {
  mockHook.mockReturnValue({
    data: mapPublishedRadar({userId:source.userId,status:'published',version:source.version,
      updatedAt:source.updatedAt,dictionaryVersion:source.dictionaryVersion,
      rubricVersion:'servidor-v1',scores:{desarrollo:0,'cloud-devops':0,'data-ai':0,qa:0,ciberseguridad:0,'gobernanza-ti':0},
      average:0,variation:null,pending:0,hasPending:false,evidence:{},sourceRevision:1,inputRevision:1,
      processingStatus:'ready',skills:[]}), loading: false, error: null, variation: null,
    refresh: vi.fn().mockResolvedValue(undefined), retry: vi.fn().mockResolvedValue(undefined), retrying: false, ...override,
  });
}

describe("Radar personal integrado con Épica 2", () => {
  beforeEach(() => { stubMatchMedia(); setRadar(); });
  afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear(); });

  it("muestra seis ejes en cero sin inventar datos ni mezclar perfiles", () => {
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByText("Mi perfil profesional")).toBeInTheDocument();
    expect(screen.queryByText(/Rúbrica|Versión del radar|Identificador/)).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("servidor-v1");
    expect(screen.getByText(/Todavía no tienes habilidades aprobadas/)).toBeInTheDocument();
    expect(screen.getByTestId("radar-dot-qa")).toBeInTheDocument();
    expect(screen.getByTestId("radar-dot-data-ai")).toBeInTheDocument();
  });

  it("abre el detalle del eje seleccionado y permite cerrarlo", () => {
    renderWithQuery(<RadarProfileView />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de QA" }));
    expect(screen.getByRole("dialog", { name: "QA" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle del área" }));
    expect(screen.queryByRole("dialog", { name: "QA" })).not.toBeInTheDocument();
  });

  it("muestra error y reintento sin representar un fallo como cero competencias", () => {
    setRadar({ data: null, error: "Error de conexión" });
    renderWithQuery(<RadarProfileView />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error de conexión");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByTestId("radar-dot-qa")).not.toBeInTheDocument();
  });

  it("mantiene una sola navegación dentro del layout de la aplicación", () => {
    sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ roleTag: "titulado" }))}.s`);
    renderWithQuery(<AppLayout><RadarProfileView /></AppLayout>);
    expect(screen.getAllByRole("navigation", { name: "Menú principal" })).toHaveLength(1);
  });
});