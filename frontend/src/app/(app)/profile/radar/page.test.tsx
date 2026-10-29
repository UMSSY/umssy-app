import { mapEpic2Radar } from "@/modules/radar-chart/sprint2/radar-mapper";
import { cloneElement, type ReactElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import RadarProfilePage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile/radar",
}));

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) =>
      cloneElement(children, { width: 600, height: 440 }),
  };
});

vi.mock("@/modules/radar-chart/sprint2/use-live-radar", () => ({ useLiveRadar: () => ({
 data: mapEpic2Radar({userId:"owner",status:"ready",version:1,updatedAt:null,dictionaryVersion:"1",skills:[]}),
 loading:false,error:null,variation:null,refresh:vi.fn(),retry:vi.fn(),retrying:false,
}) }));

describe("RadarProfilePage", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the affinity radar view of the profile", () => {
    render(<RadarProfilePage />);

    expect(screen.getByRole("heading", { level: 2, name: "Mi perfil profesional" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Desglose vectorial de afinidad" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Desglose por área" })).toBeDefined();
  });
});
