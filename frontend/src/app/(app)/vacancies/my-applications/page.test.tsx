import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applicationService } from "@/modules/applications/services/application.service";
import { buildApplication } from "@/modules/applications/testing/application-fixtures";
import { APP_ROUTE_ACCESS } from "@/shared/config/route-access.config";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import MyApplicationsPage from "./page";

vi.mock("@/modules/applications/services/application.service", () => ({
  applicationService: { getMine: vi.fn(), withdraw: vi.fn() },
}));

afterEach(cleanup);

describe("Mis postulaciones route", () => {
  it("muestra las postulaciones del usuario en /vacancies/my-applications", async () => {
    vi.mocked(applicationService.getMine).mockResolvedValue([buildApplication()]);

    renderWithQuery(<MyApplicationsPage />);

    expect(screen.getByRole("heading", { name: "Mis postulaciones", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Desarrollador Backend Python / FastAPI")).toBeInTheDocument();
  });

  it("solo permite entrar a titulados y estudiantes", () => {
    const rule = APP_ROUTE_ACCESS.find(({ pattern }) => pattern.test("/vacancies/my-applications"));

    expect(rule?.roles).toEqual(["titulado", "estudiante"]);
  });
});
