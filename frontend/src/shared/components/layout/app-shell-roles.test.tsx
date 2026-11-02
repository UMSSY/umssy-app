import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { profileService } from "@/modules/profile";
import { BackofficeShell } from "@/modules/request-review";
import { apiClient } from "@/shared/services/api-client";
import { AppRouteLayout } from "./app-route-layout";

const route = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ replace: vi.fn() }) }));

const ROUTES = [
  ["administrativo", "/dashboard"],
  ["administrativo", "/backoffice/solicitudes"],
  ["administrativo", "/backoffice/solicitudes/example"],
  ["administrativo", "/backoffice/reports/registered-users"],
  ["administrativo", "/affinity-radar/review-queue"],
  ["titulado", "/profile"],
  ["estudiante", "/vacancies"],
  ["mentor", "/mentor/availability"],
  ["empresa", "/matching"],
  ["empresa", "/recruiters"],
] as const;

beforeEach(() => {
  stubMatchMedia();
  vi.spyOn(profileService, "getProfile").mockResolvedValue({ firstName: "Ana", lastName: "Pérez" } as Awaited<ReturnType<typeof profileService.getProfile>>);
  vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Sin conexión"));
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("shared app shell across roles and routes", () => {
  it.each(ROUTES)("keeps the same chrome and red logout for %s at %s", async (role, pathname) => {
    route.pathname = pathname;
    sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ sub: "user", roleTag: role }))}.s`);
    const content = <main>Contenido de la vista</main>;
    const { container } = renderWithQuery(<AppRouteLayout>{pathname.startsWith("/backoffice") ? <BackofficeShell>{content}</BackofficeShell> : content}</AppRouteLayout>);
    await screen.findByText("Ana Pérez");
    expect(container.querySelectorAll("[data-app-shell='true']")).toHaveLength(1);
    expect(screen.getAllByRole("navigation", { name: "Menú principal" })).toHaveLength(1);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main").parentElement).toHaveClass("px-12", "py-10");
    expect(screen.getByRole("button", { name: "Cerrar barra lateral" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toHaveClass("text-brand-red", "hover:bg-brand-soft");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Mi cuenta" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Cerrar sesión" })).toHaveClass("text-brand-red");
  });
});
