import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DetailHeader } from "./backoffice-page-header";

describe("DetailHeader: celular", () => {
  afterEach(() => cleanup());

  it("el regreso y el código se acomodan en dos líneas sin partir el enlace", () => {
    render(<DetailHeader requestCode="SOL-2026-0148" />);

    expect(screen.getByRole("banner")).toHaveClass("flex-wrap");
    expect(screen.getByRole("link", { name: "Volver a la bandeja" })).toHaveClass("whitespace-nowrap");
  });
});
