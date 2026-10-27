import { cloneElement, type ReactElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "@/app/(app)/layout";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { mapEpic2Radar } from "../sprint2/radar-mapper";
import { useLiveRadar } from "../sprint2/use-live-radar";
import { RadarProfileView } from "./radar-profile-view";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile/radar",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();
  return { ...actual, SessionUserCard: () => null };
});
vi.mock("../sprint2/use-live-radar", () => ({ useLiveRadar: vi.fn() }));
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
    data: mapEpic2Radar(source), loading: false, error: null, variation: null,
    refresh: vi.fn().mockResolvedValue(undefined), retry: vi.fn().mockResolvedValue(undefined), retrying: false, ...override,
  });
}

describe("Radar personal integrado con Épica 2", () => {
  beforeEach(() => { stubMatchMedia(); setRadar(); });
  afterEach(() => { cleanup(); vi.clearAllMocks(); sessionStorage.clear(); });

  it("muestra seis ejes en cero sin inventar datos ni mezclar perfiles", () => {
    render(<RadarProfileView />);
    expect(screen.getByText("Mi perfil profesional")).toBeInTheDocument();
    expect(screen.getByText(/Todavía no tienes habilidades aprobadas/)).toBeInTheDocument();
    expect(screen.getByTestId("radar-dot-qa")).toBeInTheDocument();
    expect(screen.getByTestId("radar-dot-data-ai")).toBeInTheDocument();
  });

  it("abre el detalle del eje seleccionado y permite cerrarlo", () => {
    render(<RadarProfileView />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de QA" }));
    expect(screen.getByRole("dialog", { name: "QA" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle del área" }));
    expect(screen.queryByRole("dialog", { name: "QA" })).not.toBeInTheDocument();
  });

  it("muestra error y reintento sin representar un fallo como cero competencias", () => {
    setRadar({ data: null, error: "Error de conexión" });
    render(<RadarProfileView />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error de conexión");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByTestId("radar-dot-qa")).not.toBeInTheDocument();
  });

  it("mantiene una sola navegación dentro del layout de la aplicación", () => {
    sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ roleTag: "titulado" }))}.s`);
    render(<AppLayout><RadarProfileView /></AppLayout>);
    expect(screen.getAllByRole("navigation", { name: "Menú principal" })).toHaveLength(1);
  });
});
