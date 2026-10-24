import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import AppLayout from "../layout";
import VacanciesPage from "./page";
import VacancyDetailPage from "./[id]/page";
import VacanciesAliasPage from "./vacancies/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/vacancies",
  redirect: vi.fn(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();
  return { ...actual, SessionUserCard: () => null };
});

describe("Vacancy routes", () => {
  beforeEach(() => {
    stubMatchMedia();
    sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ roleTag: "titulado" }))}.s`);
  });
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it.each([VacanciesPage])("renders vacancy listings inside one app navigation", (Page) => {
    render(<AppLayout><Page /></AppLayout>);

    expect(screen.getAllByRole("navigation", { name: "Menú principal" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Vacantes", level: 1 })).toBeDefined();
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })[0]).toHaveAttribute("href", "/vacancies/1");
  });

  it("opens details over the listing and restores the listing on Escape", async () => {
    const user = userEvent.setup();
    render(<AppLayout><VacanciesPage /></AppLayout>);
    await user.click(screen.getAllByRole("link", { name: /^Ver detalles de / })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vacantes", level: 1 })).toBeInTheDocument();
  });

  it("redirects the legacy listing to the canonical route", async () => {
    const { redirect } = await import("next/navigation");
    VacanciesAliasPage();
    expect(redirect).toHaveBeenCalledWith("/vacancies");
  });

  it("renders resolved vacancy details and links back to the listing", async () => {
    const page = await VacancyDetailPage({ params: Promise.resolve({ id: "1" }) });
    render(<AppLayout>{page}</AppLayout>);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Desarrollador Web Junior" })).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Volver al listado" })).toBeDefined();
  });

  it("keeps the app navigation when a vacancy does not exist", async () => {
    const page = await VacancyDetailPage({ params: Promise.resolve({ id: "missing" }) });
    render(<AppLayout>{page}</AppLayout>);

    expect(screen.getByRole("navigation", { name: "Menú principal", hidden: true })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Vacante no encontrada" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Volver al listado" })).toBeDefined();
  });
});
