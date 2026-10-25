import { describe, expect, it } from "vitest";
import { buildJobOffer } from "../testing/vacancy-fixtures";
import {
  DEFAULT_JOB_OFFER_FILTERS,
  selectVisibleOffers,
  toListParams,
} from "./filter-job-offers";

const OFFERS = [
  buildJobOffer({ id: "active", title: "Ingeniero Backend", status: "Publicada" }),
  buildJobOffer({ id: "closed", title: "Analista de Sistemas", status: "Cerrada" }),
  buildJobOffer({ id: "deleted", title: "Diseñador Gráfico", status: "Eliminada" }),
];

describe("selectVisibleOffers", () => {
  it("en el alcance publicado solo conserva las vacantes activas", () => {
    const visible = selectVisibleOffers(OFFERS, "published", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      status: "Cerrada",
      search: "analista",
    });  

    expect(visible.map((offer) => offer.id)).toEqual(["active"]);
  });

  it.each(["Borrador", "Pausada", "Archivada"])("el historial no muestra vacantes en estado %s",(status) => {
    const visible = selectVisibleOffers(
      [...OFFERS, buildJobOffer({ id: "other", title: "Otra vacante", status })],
        "history",
        DEFAULT_JOB_OFFER_FILTERS,
    );

    expect(visible.map((offer) => offer.id)).toEqual(["active", "closed", "deleted"]);
  });

  it("en el historial conserva todas las vacantes sin filtros", () => {
    expect(
      selectVisibleOffers(OFFERS, "history", DEFAULT_JOB_OFFER_FILTERS).map((offer) => offer.id),
    ).toEqual(["active", "closed", "deleted"]);
  });

  it.each([
    ["Publicada", ["active"]],
    ["Cerrada", ["closed"]],
    ["Eliminada", ["deleted"]],
  ])("filtra el historial por el estado %s", (status, expected) => {
    const visible = selectVisibleOffers(OFFERS, "history", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      status,
    });

    expect(visible.map((offer) => offer.id)).toEqual(expected);
  });

  it.each(["backend", "BACKEND", "Backend", "  backend  "])(
    "busca sin distinguir mayúsculas ni espacios: %s",
    (search) => {
      const visible = selectVisibleOffers(OFFERS, "history", {
        ...DEFAULT_JOB_OFFER_FILTERS,
        search,
      });

      expect(visible.map((offer) => offer.id)).toEqual(["active"]);
    },
  );

  it("busca sin distinguir tildes en ambos sentidos", () => {
    const withoutAccent = selectVisibleOffers(OFFERS, "history", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      search: "disenador",
    });
    const withAccent = selectVisibleOffers(OFFERS, "history", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      search: "DISEÑADOR",
    });

    expect(withoutAccent.map((offer) => offer.id)).toEqual(["deleted"]);
    expect(withAccent.map((offer) => offer.id)).toEqual(["deleted"]);
  });

  it("combina búsqueda y estado exigiendo ambas condiciones", () => {
    const matching = selectVisibleOffers(OFFERS, "history", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      search: "analista",
      status: "Cerrada",
    });
    const notMatching = selectVisibleOffers(OFFERS, "history", {
      ...DEFAULT_JOB_OFFER_FILTERS,
      search: "analista",
      status: "Publicada",
    });

    expect(matching.map((offer) => offer.id)).toEqual(["closed"]);
    expect(notMatching).toEqual([]);
  });

  it("trata el texto con etiquetas como texto plano", () => {
    expect(
      selectVisibleOffers(OFFERS, "history", {
        ...DEFAULT_JOB_OFFER_FILTERS,
        search: "<script>alert(1)</script>",
      }),
    ).toEqual([]);
  });
});

describe("toListParams", () => {
  it("omite los filtros vacíos y ordena por fecha descendente", () => {
    expect(toListParams(DEFAULT_JOB_OFFER_FILTERS)).toEqual({
      search: undefined,
      modality: undefined,
      contractType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "createdAt",
      order: "desc",
    });
  });

  it("no envía el estado al servidor", () => {
    expect(toListParams({ ...DEFAULT_JOB_OFFER_FILTERS, status: "Cerrada" })).not.toHaveProperty(
      "status",
    );
  });
});