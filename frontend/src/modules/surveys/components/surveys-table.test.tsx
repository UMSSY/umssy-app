import { cleanup, screen } from "@testing-library/react";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { afterEach, describe, expect, it } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEY_ROW_ACTION_LABELS } from "../constants/survey-routes.constants";
import { SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import { SurveysTable } from "./surveys-table";

describe("SurveysTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("lista las encuestas con su creador, fecha de creación y estado", () => {
    render(<SurveysTable surveys={SURVEY_SUMMARIES} isLoading={false} hasError={false} />);
    const [, published, draft] = screen.getAllByRole("row");

    expect(published).toHaveTextContent("Encuesta de EmpleabilidadAdmin Unoadmin.1@umssy.testII-20262026-10-22 11:00Publicada");
    expect(draft).toHaveTextContent("Borrador sin carreraCarla Arcecarla.arce@umssy.edu-2026-10-22 11:00Borrador");
  });

  it("ofrece inhabilitar solo las encuestas publicadas y lo bloquea si ya tienen respuestas", () => {
    const [published, draft] = SURVEY_SUMMARIES;
    render(
      <SurveysTable
        surveys={[published, { ...published, id: "survey-3", title: "Con respuestas", responseCount: 2 }, draft]}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByRole("button", { name: `Inhabilitar ${published.title}` })).toBeEnabled();
    expect(screen.getByRole("button", { name: SURVEY_ROW_ACTION_LABELS.unpublishUnavailable })).toBeDisabled();
    expect(screen.queryByRole("button", { name: `Inhabilitar ${draft.title}` })).not.toBeInTheDocument();
  });

  it.each([
    [{ isLoading: true, hasError: false, surveys: [] }, SURVEY_MESSAGES.surveysLoading],
    [{ isLoading: false, hasError: true, surveys: [] }, SURVEY_MESSAGES.surveysLoadError],
    [{ isLoading: false, hasError: false, surveys: [] }, SURVEY_MESSAGES.surveysEmpty],
  ])("muestra el estado %o", (props, message) => {
    render(<SurveysTable {...props} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
