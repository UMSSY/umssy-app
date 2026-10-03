import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MentorDirectoryPage from "./page";

describe("MentorDirectoryPage", () => {
  it("renderiza el directorio de mentores", () => {
    render(<MentorDirectoryPage />);

    expect(
      screen.getByRole("heading", {
        name: "Directorio de mentores",
      }),
    ).toBeDefined();
  });
});