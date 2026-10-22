import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { mockApiError } from "../mocks/mock-api.mock";
import { buildSurveyFormErrors } from "./build-survey-form-errors";
import { buildSurveyPublishSummary, formatSurveyDate } from "./build-survey-publish-summary";
import { getSurveySaveErrorMessage } from "./get-survey-save-error-message";
import { createEmptySurveyFormValues } from "./survey-form-reducer";

describe("buildSurveyPublishSummary", () => {
  it("resume los datos que muestra el modal de publicar", () => {
    expect(
      buildSurveyPublishSummary({
        title: " Encuesta de Egresados ",
        description: "",
        targetCareer: "Licenciatura en Ingeniería de Sistemas",
        period: "II-2026",
        opensAt: "2026-11-03",
        closesAt: "2026-12-15",
        questions: [
          { text: "A", type: "SINGLE_CHOICE", isRequired: true, options: [] },
          { text: "B", type: "DROPDOWN", isRequired: false, options: [] },
        ],
      }),
    ).toEqual({
      title: "Encuesta de Egresados",
      audience: "Licenciatura en Ingeniería de Sistemas",
      validity: "03/11/2026 - 15/12/2026",
      questions: "2 (1 obligatoria)",
    });
  });

  it("indica todas las carreras y fechas vacías", () => {
    const summary = buildSurveyPublishSummary({ ...createEmptySurveyFormValues(), targetCareer: null, questions: [] });

    expect(summary.audience).toBe("Todas las carreras");
    expect(summary.validity).toBe("- - -");
    expect(summary.questions).toBe("0 (0 obligatorias)");
    expect(formatSurveyDate("2026-11")).toBe("-");
  });
});

describe("getSurveySaveErrorMessage", () => {
  it("avisa sin conexión cuando la petición no llega al servidor o responde 503/504", () => {
    expect(getSurveySaveErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe("Error 503/504: Sin conexión con el servidor");
    expect(getSurveySaveErrorMessage(mockApiError(504, "Gateway"))).toBe("Error 503/504: Sin conexión con el servidor");
  });

  it("avisa cuando se excede el tiempo de la solicitud", () => {
    expect(getSurveySaveErrorMessage(new AxiosError("timeout", "ECONNABORTED"))).toBe("Tiempo de solicitud excedido");
  });

  it("muestra el detalle del backend o un mensaje general", () => {
    expect(getSurveySaveErrorMessage(mockApiError(409, "Una encuesta publicada ya no se puede editar"))).toBe(
      "Una encuesta publicada ya no se puede editar",
    );
    expect(getSurveySaveErrorMessage(new AxiosError("x", "500", undefined, undefined, { status: 500, data: {} } as AxiosResponse))).toBe(
      "No se pudo guardar la encuesta. Intenta de nuevo.",
    );
    expect(getSurveySaveErrorMessage(new Error("x"))).toBe("No se pudo guardar la encuesta. Intenta de nuevo.");
  });
});

describe("buildSurveyFormErrors", () => {
  it("guarda el primer error de cada campo para mostrarlo debajo del input", () => {
    const errors = buildSurveyFormErrors(createEmptySurveyFormValues(), "publish", "2026-10-22");

    expect(errors.byField).toMatchObject({
      title: "El título de la encuesta es obligatorio",
      "questions.0.text": "El enunciado de la pregunta es obligatorio",
    });
    expect(errors.list.length).toBeGreaterThanOrEqual(Object.keys(errors.byField).length);
  });
});
