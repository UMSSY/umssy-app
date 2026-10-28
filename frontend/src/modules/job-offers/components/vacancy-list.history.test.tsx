import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { REOPEN_JOB_OFFER_TEXT, TOAST_OPTIONS } from "../constants/job-offers.constants";
import { jobOffersService } from "../services/job-offers.service";
import { buildJobOffer, buildSessionToken, COMPANY_ID } from "../testing/vacancy-fixtures";
import { VacancyList } from "./vacancy-list";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const OFFERS = [
  buildJobOffer({ id: "active", title: "Ingeniero Backend", status: "Publicada" }),
  buildJobOffer({ id: "closed", title: "Analista de Sistemas", status: "Cerrada" }),
  buildJobOffer({ id: "deleted", title: "Diseñador Gráfico", status: "Eliminada" }),
];

function mockOffers(offers = OFFERS) {
  return vi.spyOn(jobOffersService, "getByCompany").mockResolvedValue(offers);
}

describe("VacancyList en modo historial", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it("muestra todas las vacantes con su etiqueta de estado", async () => {
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);

    const list = within(await screen.findByRole("list"));

    expect(list.getAllByRole("listitem")).toHaveLength(3);
    expect(list.getByText("Activa")).toBeInTheDocument();
    expect(list.getByText("Cerrada")).toBeInTheDocument();
    expect(list.getByText("Eliminada")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Historial de vacantes" })).toBeInTheDocument();
  });

  it("el listado publicado sigue mostrando solo las vacantes activas sin etiqueta", async () => {
    mockOffers();
    renderWithQuery(<VacancyList />);

    expect(await screen.findByRole("button", { name: "Ingeniero Backend" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analista de Sistemas" })).not.toBeInTheDocument();
    expect(screen.queryByText("Activa")).not.toBeInTheDocument();
  });

  it("muestra esqueletos de carga mientras consulta el historial", () => {
    vi.spyOn(jobOffersService, "getByCompany").mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<VacancyList scope="history" />);

    expect(screen.getByRole("status", { name: "Cargando historial de vacantes..." })).toBeInTheDocument();
  });

  it("filtra en tiempo real sin distinguir mayúsculas ni tildes", async () => {
    const user = userEvent.setup();
    const getOffers = mockOffers();
    renderWithQuery(<VacancyList scope="history" />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });

    await user.type(screen.getByRole("searchbox", { name: "Buscar por título de vacante" }), "DISENADOR");

    expect(screen.getByRole("button", { name: "Diseñador Gráfico" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ingeniero Backend" })).not.toBeInTheDocument();
    expect(getOffers).toHaveBeenCalledTimes(1);
    expect(getOffers.mock.calls[0][1]).not.toHaveProperty("search");
  });

  it("muestra el mensaje de búsqueda sin resultados y se restablece al limpiar", async () => {
    const user = userEvent.setup();
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });
    const search = screen.getByRole("searchbox", { name: "Buscar por título de vacante" });

    await user.type(search, "zzz");

    expect(
      screen.getByText("No se encontraron vacantes que coincidan con la búsqueda"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();

    await user.clear(search);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it.each([
    ["Activas", ["Ingeniero Backend"]],
    ["Cerradas", ["Analista de Sistemas"]],
    ["Eliminadas", ["Diseñador Gráfico"]],
  ])("filtra el historial por el estado %s y vuelve a Todas", async (label, titles) => {
    const user = userEvent.setup();
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: label }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(titles.length));
    titles.forEach((title) =>
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: "Todas" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));
  }, 10000);

  it("combina la búsqueda con el estado exigiendo ambas condiciones", async () => {
    const user = userEvent.setup();
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });

    await user.type(screen.getByRole("searchbox", { name: "Buscar por título de vacante" }), "analista");
    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: "Activas" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("listitem")).not.toBeInTheDocument());
    expect(screen.getByText("Ninguna vacante coincide con los filtros.")).toBeInTheDocument();
  }, 10000);

  it("muestra el estado vacío con acceso directo a crear una vacante", async () => {
    mockOffers([]);
    renderWithQuery(<VacancyList scope="history" />);

    expect(await screen.findByText("Aún no tienes vacantes en tu historial")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Crear nueva vacante" });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/recruiters/job-offers/new"));
  });

  it("incluye el botón de crear vacante junto a la búsqueda cuando hay vacantes", async () => {
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);

    expect(await screen.findByRole("link", { name: "Crear nueva vacante" })).toHaveAttribute(
      "href",
      "/recruiters/job-offers/new",
    );
  });

  it("muestra un error amigable y permite reintentar sin cerrar la sesión", async () => {
    const user = userEvent.setup();
    const getOffers = vi
      .spyOn(jobOffersService, "getByCompany")
      .mockRejectedValueOnce(new Error("HTTP 500"))
      .mockResolvedValueOnce(OFFERS);
    renderWithQuery(<VacancyList scope="history" />);

    expect(
      await screen.findByText("Error al cargar el historial. Inténtelo más tarde."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("button", { name: "Ingeniero Backend" })).toBeInTheDocument();
    expect(getOffers).toHaveBeenCalledTimes(2);
  });

  it("ofrece Reabrir solo en las vacantes cerradas", async () => {
    mockOffers();
    renderWithQuery(<VacancyList scope="history" />);

    const reopenButtons = await screen.findAllByRole("button", { name: "Reabrir" });
    expect(reopenButtons).toHaveLength(1);
    expect(reopenButtons[0]).toBeEnabled();
    expect(within(reopenButtons[0].closest("li") as HTMLElement).getByText("Cerrada")).toBeInTheDocument();
  });

  it("pide confirmación con el título de la vacante y Cancelar no la reabre", async () => {
    const user = userEvent.setup();
    mockOffers();
    const reopen = vi.spyOn(jobOffersService, "reopen");
    renderWithQuery(<VacancyList scope="history" />);

    await user.click(await screen.findByRole("button", { name: "Reabrir" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(REOPEN_JOB_OFFER_TEXT.title)).toBeInTheDocument();
    expect(within(dialog).getByText("Analista de Sistemas")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(reopen).not.toHaveBeenCalled();
  });

  it("Escape cierra la confirmación sin reabrir", async () => {
    const user = userEvent.setup();
    mockOffers();
    const reopen = vi.spyOn(jobOffersService, "reopen");
    renderWithQuery(<VacancyList scope="history" />);

    await user.click(await screen.findByRole("button", { name: "Reabrir" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(reopen).not.toHaveBeenCalled();
  });

  it("reabre la vacante, avisa, cierra el modal y la muestra como Activa en el historial", async () => {
    const user = userEvent.setup();
    const reopened = OFFERS.map((offer) =>
      offer.id === "closed" ? { ...offer, status: "Publicada" } : offer,
    );
    mockOffers().mockResolvedValueOnce(OFFERS).mockResolvedValueOnce(reopened);
    const reopen = vi.spyOn(jobOffersService, "reopen").mockResolvedValue(reopened[1]);
    renderWithQuery(<VacancyList scope="history" />);

    await user.click(await screen.findByRole("button", { name: "Reabrir" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reabrir" }));

    expect(reopen).toHaveBeenCalledWith(COMPANY_ID, "closed");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith(REOPEN_JOB_OFFER_TEXT.success, TOAST_OPTIONS);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reabrir" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Activa")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Analista de Sistemas" })).toBeInTheDocument();
  });

  it("con el filtro Cerradas la vacante reabierta deja de aparecer", async () => {
    const user = userEvent.setup();
    const reopened = OFFERS.map((offer) =>
      offer.id === "closed" ? { ...offer, status: "Publicada" } : offer,
    );
    mockOffers().mockResolvedValueOnce(OFFERS).mockResolvedValueOnce(reopened);
    vi.spyOn(jobOffersService, "reopen").mockResolvedValue(reopened[1]);
    renderWithQuery(<VacancyList scope="history" />);
    await screen.findByRole("button", { name: "Ingeniero Backend" });

    await user.click(screen.getByRole("button", { name: /Filtrar por/ }));
    await user.click(screen.getByRole("button", { name: "Cerradas" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Reabrir" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reabrir" }));

    await waitFor(() => expect(screen.queryByRole("listitem")).not.toBeInTheDocument());
    expect(screen.getByText("Ninguna vacante coincide con los filtros.")).toBeInTheDocument();
  }, 10000);

  it("si falla la reapertura avisa, no muestra éxito y la vacante sigue Cerrada", async () => {
    const user = userEvent.setup();
    mockOffers();
    vi.spyOn(jobOffersService, "reopen").mockRejectedValue(
      new AxiosError("fail", "ERR_BAD_RESPONSE", undefined, undefined, { status: 500, data: {} } as AxiosResponse),
    );
    renderWithQuery(<VacancyList scope="history" />);

    await user.click(await screen.findByRole("button", { name: "Reabrir" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reabrir" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(REOPEN_JOB_OFFER_TEXT.error, TOAST_OPTIONS),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Cerrada", { ignore: "[role=dialog] *" })).toBeInTheDocument();
  });
});