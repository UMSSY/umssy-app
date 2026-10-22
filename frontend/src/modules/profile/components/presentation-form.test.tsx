import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PRESENTATION_VALUES } from "../config/profile-form-defaults.config";
import { PROFILE_VALIDATION_MESSAGES } from "../constants/profile-validation.constants";
import type { PresentationValues } from "../types/presentation-values.types";
import { PresentationForm } from "./presentation-form";

const SAVED_VALUES: PresentationValues = {
  headline: "Desarrolladora web junior",
  aboutMe: "Systems engineering graduate from UMSS.",
};

function renderForm(initialValues = EMPTY_PRESENTATION_VALUES, isSaving = false) {
  const onSubmit = vi.fn();
  render(
    <PresentationForm
      initialValues={initialValues}
      isSaving={isSaving}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe("PresentationForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders focused inputs without a duplicate preview", () => {
    renderForm();
    expect(screen.getByText("Escribe tu presentación")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.queryByText("Así se verá en tu perfil")).not.toBeInTheDocument();
  });

  it("keeps changes in the editor until the user saves", async () => {
    const { onSubmit, user } = renderForm();
    await user.type(screen.getByLabelText(/Titular profesional/), "Desarrolladora web junior");
    await user.type(screen.getByLabelText(/Acerca de/), "Looking for remote work.");
    expect(screen.getByLabelText(/Titular profesional/)).toHaveValue("Desarrolladora web junior");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText("Así se verá en tu perfil")).not.toBeInTheDocument();
  });

  it("only shows the headline and about me fields", () => {
    renderForm();

    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.queryByLabelText(/Oportunidades que me interesan/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Acerca de/)).toHaveAttribute(
      "placeholder",
      "Cuenta quién eres, en qué te especializas y qué oportunidades laborales te interesan.",
    );
  });

  it("shows the server field errors next to their fields", () => {
    render(
      <PresentationForm
        initialValues={EMPTY_PRESENTATION_VALUES}
        serverErrors={{ headline: "Ingresa un titular con hasta 150 caracteres." }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Titular profesional/)).toHaveAccessibleDescription(
      "Ingresa un titular con hasta 150 caracteres.",
    );
  });

  it("rejects a headline longer than 150 characters", async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/Titular profesional/), "a".repeat(151));
    await user.type(screen.getByLabelText(/Acerca de/), "Graduate.");
    await user.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Titular profesional/)).toHaveAccessibleDescription(
      PROFILE_VALIDATION_MESSAGES.headlineTooLong,
    );
  });

  it("submits the trimmed values", async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(/Titular profesional/), " Desarrolladora web junior ");
    await user.type(screen.getByLabelText(/Acerca de/), "Graduate from UMSS.");
    await user.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(onSubmit).toHaveBeenCalledWith({
      headline: "Desarrolladora web junior",
      aboutMe: "Graduate from UMSS.",
    });
  });

  it("shows an error next to each empty required field and does not submit", async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Guardar presentación" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Titular profesional/)).toHaveAccessibleDescription(
      PROFILE_VALIDATION_MESSAGES.required,
    );
    expect(screen.getByLabelText(/Acerca de/)).toHaveAccessibleDescription(
      PROFILE_VALIDATION_MESSAGES.required,
    );
  });

  it("clears the errors when cancelling", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Guardar presentación" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText(PROFILE_VALIDATION_MESSAGES.required)).not.toBeInTheDocument();
  });

  it("restores the initial values when cancelling", async () => {
    const { user } = renderForm(SAVED_VALUES);

    await user.clear(screen.getByLabelText(/Titular profesional/));
    await user.type(screen.getByLabelText(/Titular profesional/), "Another headline");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByLabelText(/Titular profesional/)).toHaveValue("Desarrolladora web junior");
  });

  it("disables the form while saving", () => {
    renderForm(SAVED_VALUES, true);

    expect(screen.getByLabelText(/Acerca de/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });
});
