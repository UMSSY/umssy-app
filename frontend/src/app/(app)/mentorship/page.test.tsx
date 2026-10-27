import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import MentorshipPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async () => null),
  writeIndexedDb: vi.fn(async () => {}),
  removeIndexedDb: vi.fn(async () => {}),
}));

describe("MentorshipPage", () => {
  it("renderiza la vista de mentoría", () => {
    renderWithQuery(<MentorshipPage />);

    expect(screen.getByText("Participa como mentor")).toBeDefined();

    expect(
      screen.getByRole("heading", {
        name: "Participación",
      }),
    ).toBeDefined();

    expect(
      screen.getByText("Quiero participar como mentor"),
    ).toBeDefined();
  });
});
