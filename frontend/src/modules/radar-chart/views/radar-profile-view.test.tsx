import { cloneElement, type ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { RADAR_AREA_SCORES } from "../data/radar-profile.data";
import { RadarProfileView } from "./radar-profile-view";

vi.mock("next/navigation", () => ({
  usePathname: () => "/affinity-radar/profile",
}));

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) =>
      cloneElement(children, { width: 600, height: 440 }),
  };
});

describe("RadarProfileView", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the page header, the profile card, KPI cards, the radar and the breakdown", () => {
    render(<RadarProfileView />);

    expect(screen.getByRole("heading", { level: 1, name: "Radar de afinidad" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Carlos Mendoza Ríos" })).toBeDefined();
    expect(screen.getByRole("list", { name: "Resumen del perfil" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Desglose vectorial de afinidad" })).toBeDefined();

    const breakdown = within(screen.getByRole("complementary", { name: "Desglose por área" }));
    RADAR_AREA_SCORES.forEach((area) => {
      expect(screen.getByTestId(`radar-dot-${area.id}`)).toBeDefined();
      expect(breakdown.getByText(area.name)).toBeDefined();
    });
    expect(breakdown.getByText("6,25")).toBeDefined();
  });

  it("shows the breadcrumb with Mi perfil and Radar de afinidad", () => {
    render(<RadarProfileView />);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByText("Mi perfil")).toBeDefined();
    const current = within(breadcrumb).getByText("Radar de afinidad");
    expect(current.getAttribute("aria-current")).toBe("page");
  });

  it("does not render its own sidebar", () => {
    render(<RadarProfileView />);

    expect(document.querySelector('[data-slot="sidebar"]')).toBeNull();
  });

  it("does not make HTTP requests", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<RadarProfileView />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
