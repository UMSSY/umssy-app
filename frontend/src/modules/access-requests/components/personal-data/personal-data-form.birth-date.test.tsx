import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AccessRequestProvider } from "../../contexts/access-request-context";
import { getLatestBirthDate } from "../../utils/get-latest-birth-date";
import { PersonalDataForm } from "./personal-data-form";

describe("PersonalDataForm: fecha de nacimiento", () => {
  afterEach(() => cleanup());

  it("el calendario no ofrece años futuros: el último año es el de hace 18 años", async () => {
    const user = userEvent.setup();
    render(
      <AccessRequestProvider>
        <PersonalDataForm />
      </AccessRequestProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Elegir fecha en el calendario" }));
    const dialog = await screen.findByRole("dialog", { name: "Seleccionar fecha" });
    const yearSelect = within(dialog).getByRole("combobox", { name: "Año" });
    const years = within(yearSelect).getAllByRole("option").map((option) => Number(option.textContent));

    const latestYear = Number(getLatestBirthDate().slice(0, 4));
    expect(Math.max(...years)).toBe(latestYear);
    expect(years).not.toContain(new Date().getFullYear());
  });
});
