import { describe, expect, it } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { buildAxiosError } from "../testing/survey-fixtures";
import { mapApiErrors } from "./map-api-errors";

describe("mapApiErrors", () => {
  it("traduce la lista de errores de validación a rutas de pregunta", () => {
    const error = buildAxiosError(400, {
      errors: [
        { field: "questions.2.options.0.label", message: "La opción no puede estar vacía" },
        { field: "closesAt", message: SURVEY_MESSAGES.closesBeforeOpens },
        { field: 3, message: "ignorado" },
      ],
    });

    expect(mapApiErrors(error)).toEqual([
      {
        path: "questions.2.options",
        label: "Pregunta 3",
        message: "La opción no puede estar vacía",
        summary: "La opción no puede estar vacía",
      },
      {
        path: "closesAt",
        label: "Fecha de cierre",
        message: SURVEY_MESSAGES.closesBeforeOpens,
        summary: SURVEY_MESSAGES.closesBeforeOpens,
      },
    ]);
  });

  it("usa el campo y el detalle de una excepción de dominio", () => {
    const error = buildAxiosError(409, { detail: SURVEY_MESSAGES.duplicatedTitle, data: { field: "title" } });

    expect(mapApiErrors(error)).toEqual([
      { path: "title", label: "Título", message: SURVEY_MESSAGES.duplicatedTitle, summary: SURVEY_MESSAGES.duplicatedTitle },
    ]);
  });

  it("devuelve una lista vacía si no reconoce el error", () => {
    expect(mapApiErrors(null)).toEqual([]);
    expect(mapApiErrors(new Error("x"))).toEqual([]);
    expect(mapApiErrors(buildAxiosError(500, { detail: "Fallo" }))).toEqual([]);
  });

  it("usa una etiqueta genérica para campos desconocidos", () => {
    expect(mapApiErrors(buildAxiosError(400, { detail: "x", data: { field: "otro" } }))[0].label).toBe("Encuesta sin título");
  });
});
