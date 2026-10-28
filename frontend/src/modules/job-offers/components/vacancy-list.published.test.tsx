import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { DELETE_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { jobOffersService } from "../services/job-offers.service";
import { buildJobOffer, buildSessionToken, COMPANY_ID } from "../testing/vacancy-fixtures";
import { VacancyList } from "./vacancy-list";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const OFFERS = [
  buildJobOffer({ id: "backend", title: "Ingeniero Backend" }),
  buildJobOffer({ id: "design", title: "Diseñadora UX" }),
];

function mockOffers(offers = OFFERS) {
  return vi.spyOn(jobOffersService, "getByCompany").mockResolvedValue(offers);
}

describe("VacancyList en el portal de empresa", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it("muestra el estado vacío con el texto acordado y el acceso a crear una vacante", async () => {
    mockOffers([]);
    renderWithQuery(<VacancyList />);

    expect(await screen.findByText("Aún no tienes vacantes publicadas")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Crear nueva vacante" });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/recruiters/job-offers/new"));
  });

  it("muestra esqueletos de carga mientras consulta las vacantes", () => {
    vi.spyOn(jobOffersService, "getByCompany").mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<VacancyList />);

    expect(screen.getByRole("status", { name: "Cargando vacantes..." })).toBeInTheDocument();
  });

  it("avisa del error con una alerta temporal y permite reintentar", async () => {
    const user = userEvent.setup();
    vi.spyOn(jobOffersService, "getByCompany")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(OFFERS);
    renderWithQuery(<VacancyList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar tus vacantes.");
    expect(toast.error).toHaveBeenCalledWith("No se pudieron cargar tus vacantes.", TOAST_OPTIONS);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("button", { name: "Ingeniero Backend" })).toBeInTheDocument();
  });

  it("busca sin distinguir mayúsculas ni tildes y sin volver a consultar al servidor", async () => {
    const user = userEvent.setup();
    const getOffers = mockOffers();
    renderWithQuery(<VacancyList />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });

    await user.type(screen.getByRole("searchbox", { name: "Buscar por título de vacante" }), "DISENADORA");

    expect(screen.getByRole("button", { name: "Diseñadora UX" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ingeniero Backend" })).not.toBeInTheDocument();
    expect(getOffers).toHaveBeenCalledTimes(1);
  });

  it("muestra el mensaje de búsqueda sin resultados y Limpiar filtros también borra la búsqueda", async () => {
    const user = userEvent.setup();
    mockOffers();
    renderWithQuery(<VacancyList />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });
    const search = screen.getByRole("searchbox", { name: "Buscar por título de vacante" });

    await user.type(search, "zzz");
    expect(
      screen.getByText("No se encontraron vacantes que coincidan con la búsqueda"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
    expect(search).toHaveValue("");
  });

  it("pagina de 10 en 10 cuando hay muchas vacantes", async () => {
    const user = userEvent.setup();
    mockOffers(
      Array.from({ length: 23 }, (_, index) =>
        buildJobOffer({ id: `offer-${index + 1}`, title: `Vacante ${index + 1}` }),
      ),
    );
    renderWithQuery(<VacancyList />);
    await screen.findByRole("button", { name: "Vacante 1" });

    const list = screen.getAllByRole("list")[0];
    expect(within(list).getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("button", { name: "Vacante 11" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vacante 1" })).not.toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("pide confirmación mostrando el título y cancelar no elimina", async () => {
    const user = userEvent.setup();
    mockOffers();
    const remove = vi.spyOn(jobOffersService, "remove");
    renderWithQuery(<VacancyList />);

    await user.click(
      await screen.findByRole("button", { name: "Eliminar vacante Ingeniero Backend" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(DELETE_JOB_OFFER_TEXT.title)).toBeInTheDocument();
    expect(within(dialog).getByText("Ingeniero Backend")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(remove).not.toHaveBeenCalled();
  });

  it("elimina la vacante, cierra el modal, avisa y refresca la lista", async () => {
    const user = userEvent.setup();
    const getOffers = mockOffers();
    getOffers.mockResolvedValueOnce(OFFERS).mockResolvedValueOnce([OFFERS[1]]);
    const remove = vi.spyOn(jobOffersService, "remove").mockResolvedValue(undefined);
    renderWithQuery(<VacancyList />);

    await user.click(
      await screen.findByRole("button", { name: "Eliminar vacante Ingeniero Backend" }),
    );
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(remove).toHaveBeenCalledWith(COMPANY_ID, "backend");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith(DELETE_JOB_OFFER_TEXT.success, TOAST_OPTIONS);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Ingeniero Backend" })).not.toBeInTheDocument(),
    );
  });

  it("si falla la eliminación muestra el error y conserva la vacante", async () => {
    const user = userEvent.setup();
    mockOffers();
    vi.spyOn(jobOffersService, "remove").mockRejectedValue(new Error("HTTP 500"));
    renderWithQuery(<VacancyList />);

    await user.click(
      await screen.findByRole("button", { name: "Eliminar vacante Ingeniero Backend" }),
    );
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(DELETE_JOB_OFFER_TEXT.error, TOAST_OPTIONS),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ingeniero Backend", hidden: true }),
    ).toBeInTheDocument();
  });
});
