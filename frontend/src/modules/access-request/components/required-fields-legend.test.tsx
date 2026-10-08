import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RequiredFieldsLegend } from "./required-fields-legend";

afterEach(cleanup);

describe("RequiredFieldsLegend", () => {
  it("muestra la leyenda de campo obligatorio con su asterisco", () => {
    render(<RequiredFieldsLegend />);

    expect(screen.getByText("Campo obligatorio")).toBeTruthy();
    expect(screen.getByText("*")).toBeTruthy();
  });
});
