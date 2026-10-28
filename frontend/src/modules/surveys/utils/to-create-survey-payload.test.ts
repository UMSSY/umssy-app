import { describe, expect, it } from "vitest";
import { buildSurveyState } from "../testing/survey-fixtures";
import { toCreateSurveyPayload } from "./to-create-survey-payload";

describe("toCreateSurveyPayload", () => {
  it("recorta textos, omite opciones vacías y convierte fechas", () => {
    const state = buildSurveyState({
      title: "  Encuesta  ",
      description: "   ",
      questions: [
        {
          id: "q1",
          statement: "  ¿Trabajas? ",
          type: "multiple_choice",
          isRequired: false,
          options: [
            { id: "a", label: " Sí " },
            { id: "b", label: "   " },
            { id: "c", label: "No" },
          ],
        },
      ],
    });

    expect(toCreateSurveyPayload(state, "published")).toEqual({
      title: "Encuesta",
      description: undefined,
      careerId: "career-systems",
      academicPeriod: "II-2026",
      opensAt: "2026-11-03T04:00:00.000Z",
      closesAt: "2026-12-16T03:59:59.999Z",
      status: "published",
      questions: [{ statement: "¿Trabajas?", type: "multiple_choice", isRequired: false, options: [{ label: "Sí" }, { label: "No" }] }],
    });
  });

  it("deja sin definir los campos vacíos de un borrador", () => {
    const payload = toCreateSurveyPayload(
      buildSurveyState({ careerId: "", academicPeriod: "", opensAt: "", closesAt: "", description: "Algo" }),
      "draft",
    );

    expect(payload).toMatchObject({ status: "draft", description: "Algo", careerId: undefined, opensAt: undefined });
  });
});
