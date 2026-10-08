import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RequiredFieldLabel } from "./required-field-label";

afterEach(cleanup);

describe("RequiredFieldLabel", () => {
  it("muestra el asterisco cuando el campo es obligatorio", () => {
    render(<RequiredFieldLabel htmlFor="names">Nombres</RequiredFieldLabel>);

    expect(screen.getByText("Nombres")).toBeTruthy();
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("no muestra el asterisco cuando el campo es opcional", () => {
    render(
      <RequiredFieldLabel htmlFor="phone" isRequired={false}>
        Teléfono (opcional)
      </RequiredFieldLabel>,
    );

    expect(screen.getByText("Teléfono (opcional)")).toBeTruthy();
    expect(screen.queryByText("*")).toBeNull();
  });

  it("queda asociada al campo mediante htmlFor", () => {
    render(
      <>
        <RequiredFieldLabel htmlFor="names">Nombres</RequiredFieldLabel>
        <input id="names" />
      </>,
    );

    expect(screen.getByLabelText(/Nombres/)).toBeTruthy();
  });
});
