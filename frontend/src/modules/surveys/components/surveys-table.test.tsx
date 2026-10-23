import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEY_SUMMARIES } from "../testing/survey-fixtures";
import { SurveysTable } from "./surveys-table";

describe("SurveysTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("lista las encuestas con su vigencia y estado", () => {
    render(<SurveysTable surveys={SURVEY_SUMMARIES} isLoading={false} hasError={false} />);
    const [, published, draft] = screen.getAllByRole("row");

    expect(published).toHaveTextContent("Encuesta de EmpleabilidadIngeniería de SistemasII-202603/11/2026 - 15/12/20264Publicada");
    expect(draft).toHaveTextContent("Borrador sin carrera---0Borrador");
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
