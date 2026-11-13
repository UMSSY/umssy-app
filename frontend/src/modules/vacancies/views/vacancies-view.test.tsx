import "@/shared/testing/indexed-db.mock";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jobApplicationService } from "@/modules/matching/services/job-application.service";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { vacanciesService } from "../services/vacancies.service";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacanciesView } from "./vacancies-view";

vi.mock("../services/vacancies.service", () => ({
  vacanciesService: { listPublished: vi.fn() },
}));

vi.mock("@/modules/matching/services/job-application.service", () => ({
  jobApplicationService: { apply: vi.fn(), getMine: vi.fn() },
}));

const listPublished = vi.mocked(vacanciesService.listPublished);
const getMine = vi.mocked(jobApplicationService.getMine);

const VACANCIES = [
  buildVacancy(),
  buildVacancy({ id: "7c3e9a10-1d2b-4f5a-9c8e-2b4d6f8a0c11", title: "Analista de Datos", companyName: "Datos SRL", requirements: ["SQL"] }),
];

async function setRole(roleTag: string) {
  await saveAccessToken(`h.${btoa(JSON.stringify({ roleTag }))}.s`);
}

beforeEach(() => {
  vi.clearAllMocks();
  listPublished.mockResolvedValue(VACANCIES);
  getMine.mockResolvedValue({ hasApplied: false, application: null });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("VacanciesView", () => {
  it("lista las vacantes publicadas que devuelve la API", async () => {
    renderWithQuery(<VacanciesView />);

    expect(
      await screen.findByRole("link", {
        name: "Ver detalles de Desarrollador Full Stack",
      }),
    ).toHaveAttribute("href", `/vacancies/${VACANCIES[0].id}`);
    expect(screen.getByRole("status")).toHaveTextContent("2 vacantes encontradas");
    expect(listPublished).toHaveBeenCalledTimes(1);
  });

  it("permite recuperar los resultados desde una búsqueda sin coincidencias", async () => {
    renderWithQuery(<VacanciesView />);
    const initialLinks = await screen.findAllByRole("link", { name: /^Ver detalles de / });
    const searchInput = screen.getByRole("searchbox", { name: /Buscar vacantes/ });

    fireEvent.change(searchInput, { target: { value: "vacante-sin-coincidencias" } });

    expect(screen.getByRole("heading", { name: "No se encontraron vacantes" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("0 vacantes encontradas");
    expect(screen.queryByRole("link", { name: /^Ver detalles de / })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));

    expect(searchInput).toHaveValue("");
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(initialLinks.length);
  });

  it("busca también por tecnología requerida", async () => {
    renderWithQuery(<VacanciesView />);
    await screen.findAllByRole("link", { name: /^Ver detalles de / });

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar vacantes/ }), { target: { value: "sql" } });

    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Ver detalles de Analista de Datos" })).toBeInTheDocument();
  });

  it("avisa cuando todavía no hay vacantes publicadas", async () => {
    listPublished.mockResolvedValue([]);
    renderWithQuery(<VacanciesView />);

    expect(await screen.findByRole("heading", { name: "Todavía no hay vacantes publicadas" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No se encontraron vacantes" })).toBeNull();
    expect(screen.getByText("Vuelve pronto para ver nuevas oportunidades.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("muestra un error con opción de reintentar si la API falla", async () => {
    listPublished.mockRejectedValue(new Error("network"));
    renderWithQuery(<VacanciesView />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByRole("heading", { name: "No pudimos cargar las vacantes" })).toBeInTheDocument();

    listPublished.mockResolvedValue(VACANCIES);
    fireEvent.click(within(alert).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("link", { name: "Ver detalles de Analista de Datos" })).toBeInTheDocument();
  });

  it("muestra el botón de postular a titulados y estudiantes en el detalle", async () => {
    await setRole("estudiante");
    renderWithQuery(<VacanciesView initialVacancyId={VACANCIES[0].id} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Desarrollador Full Stack" })).toBeInTheDocument();
    expect(await within(dialog).findByRole("button", { name: "Enviar postulación" })).toBeInTheDocument();
    expect(getMine).toHaveBeenCalledWith(VACANCIES[0].id);
  });

  it("no muestra el botón de postular a un mentor", async () => {
    await setRole("mentor");
    renderWithQuery(<VacanciesView initialVacancyId={VACANCIES[0].id} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Volver al listado" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Enviar postulación" })).toBeNull();
    expect(getMine).not.toHaveBeenCalled();
  });
});

describe("VacanciesView - criterios de HU-11", () => {
  it("lista cada vacante publicada que devuelve la API, sin filtrar por el perfil (AC-11.1)", async () => {
    listPublished.mockResolvedValue([
      ...VACANCIES,
      buildVacancy({ id: "0f2c6a7e-3b1d-4c5e-8a9f-1d2e3f4a5b6c", title: "Ingeniero COBOL", requirements: ["COBOL"] }),
    ]);
    renderWithQuery(<VacanciesView />);

    expect(await screen.findByRole("link", { name: "Ver detalles de Ingeniero COBOL" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("3 vacantes encontradas");
  });

  it("muestra en la tarjeta el título, la empresa, la descripción, el salario, el contrato y Ver detalles (AC-11.2)", async () => {
    listPublished.mockResolvedValue([buildVacancy()]);
    renderWithQuery(<VacanciesView />);

    const card = (await screen.findByRole("link", { name: "Ver detalles de Desarrollador Full Stack" })).closest("article");
    expect(card).not.toBeNull();
    const scope = within(card as HTMLElement);
    expect(scope.getByRole("heading", { name: "Desarrollador Full Stack" })).toBeInTheDocument();
    expect(scope.getByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(scope.getByText("Desarrollo de servicios web con Node.js y React.")).toBeInTheDocument();
    expect(scope.getByText("Bs 5.000 - 8.000")).toBeInTheDocument();
    expect(scope.getByText("Presencial")).toBeInTheDocument();
    expect(scope.getByText("Medio tiempo")).toBeInTheDocument();
  });

  it.each([
    ["el cargo", "analista", "Ver detalles de Analista de Datos"],
    ["la empresa", "datos srl", "Ver detalles de Analista de Datos"],
    ["un requisito", "sql", "Ver detalles de Analista de Datos"],
  ])("filtra por %s y el contador refleja solo los resultados (AC-11.6, AC-11.7)", async (_label, term, expectedLink) => {
    renderWithQuery(<VacanciesView />);
    await screen.findAllByRole("link", { name: /^Ver detalles de / });

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar vacantes/ }), { target: { value: term } });

    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(1);
    expect(screen.getByRole("link", { name: expectedLink })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 vacante encontrada");
  });

  it("mantiene el aviso de error si al reintentar la consulta vuelve a fallar (AC-11.12)", async () => {
    listPublished.mockRejectedValue(new Error("network"));
    renderWithQuery(<VacanciesView />);

    const alert = await screen.findByRole("alert");
    fireEvent.click(within(alert).getByRole("button", { name: "Reintentar" }));

    await vi.waitFor(() => expect(listPublished).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "No pudimos cargar las vacantes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Ver detalles de / })).toBeNull();
  });

  it("muestra en el detalle las condiciones, la ubicación, la descripción y las tecnologías (AC-11.13)", async () => {
    listPublished.mockResolvedValue([
      buildVacancy({ positionsAvailable: 3, languages: "Español, Inglés", requirements: ["Node.js", "React"] }),
    ]);
    renderWithQuery(<VacanciesView initialVacancyId={VACANCIES[0].id} />);

    const dialog = await screen.findByRole("dialog");
    const conditions = within(within(dialog).getByLabelText("Condiciones de la vacante"));
    expect(conditions.getByText("Bs 5.000 - 8.000")).toBeInTheDocument();
    expect(conditions.getByText("Presencial")).toBeInTheDocument();
    expect(conditions.getByText("Medio tiempo")).toBeInTheDocument();
    expect(conditions.getByText("3")).toBeInTheDocument();
    expect(conditions.getByText("Español, Inglés")).toBeInTheDocument();
    expect(conditions.getByRole("link", { name: /Ver en el mapa/ })).toHaveAttribute("target", "_blank");
    expect(within(dialog).getByRole("heading", { name: "Descripción" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Tecnologías requeridas" })).toBeInTheDocument();
    expect(within(dialog).getByText("Node.js")).toBeInTheDocument();
  });

  it("vuelve al listado al pulsar Volver al listado en el detalle (AC-11.14)", async () => {
    renderWithQuery(<VacanciesView />);

    fireEvent.click(await screen.findByRole("link", { name: "Ver detalles de Analista de Datos" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Volver al listado" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getAllByRole("link", { name: /^Ver detalles de / })).toHaveLength(2);
  });
});

describe("VacanciesView - tarjeta de vacante", () => {
  it("muestra la modalidad de la vacante", async () => {
    listPublished.mockResolvedValue([buildVacancy({ modality: "Remoto" })]);
    renderWithQuery(<VacanciesView />);

    expect(await screen.findByText("Remoto")).toBeInTheDocument();
  });

  it("muestra las habilidades requeridas como chips", async () => {
    listPublished.mockResolvedValue([buildVacancy({ requirements: ["Node.js", "React"] })]);
    renderWithQuery(<VacanciesView />);

    const skills = await screen.findByRole("list", { name: "Habilidades requeridas" });
    expect(within(skills).getByText("Node.js")).toBeInTheDocument();
    expect(within(skills).getByText("React")).toBeInTheDocument();
  });

  it("oculta la lista de habilidades cuando la vacante no tiene ninguna", async () => {
    listPublished.mockResolvedValue([buildVacancy({ requirements: [] })]);
    renderWithQuery(<VacanciesView />);

    await screen.findByRole("link", { name: /^Ver detalles de / });
    expect(screen.queryByRole("list", { name: "Habilidades requeridas" })).toBeNull();
  });

  it("abre la ubicación de Google Maps en una pestaña nueva", async () => {
    listPublished.mockResolvedValue([buildVacancy({ locationUrl: "https://maps.app.goo.gl/abc123" })]);
    renderWithQuery(<VacanciesView />);

    const link = await screen.findByRole("link", { name: /Ver ubicación/ });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/abc123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it.each(["https://jobs.example.invalid/seed/1", "javascript:alert(1)", ""])(
    "oculta la ubicación cuando el enlace %j no es de Google Maps",
    async (locationUrl) => {
      listPublished.mockResolvedValue([buildVacancy({ locationUrl })]);
      renderWithQuery(<VacanciesView />);

      await screen.findByRole("link", { name: /^Ver detalles de / });
      expect(screen.queryByRole("link", { name: /Ver ubicación/ })).toBeNull();
    },
  );
});
