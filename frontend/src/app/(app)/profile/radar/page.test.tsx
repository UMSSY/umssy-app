import { mapPublishedRadar } from "@/modules/radar-chart/mappers/radar-published.mapper";
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
 data: mapPublishedRadar({userId:'owner',status:'published',version:1,updatedAt:null,dictionaryVersion:'1',
   rubricVersion:'servidor-v1',scores:{desarrollo:0,'cloud-devops':0,'data-ai':0,qa:0,ciberseguridad:0,'gobernanza-ti':0},
   average:0,variation:null,pending:0,hasPending:false,evidence:{},sourceRevision:1,inputRevision:1,
   processingStatus:'ready',skills:[]}),
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