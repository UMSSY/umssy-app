import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import MentorshipPage from "./page";
import { writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async () => null),
  writeIndexedDb: vi.fn(async () => {}),
  removeIndexedDb: vi.fn(async () => {}),
}));

vi.mock("@/modules/mentorship/services/technical-area.service", () => ({
  getTechnicalAreas: vi.fn(async () => []),
}));

vi.mock("@/modules/mentorship/services/orientation-type.service", () => ({
  getOrientationTypes: vi.fn(async () => []),
}));

describe("MentorshipPage", () => {
  it("renderiza la vista de mentoría", async () => {
    const rendered = await act(async () => renderWithQuery(<MentorshipPage />));

    try {
      await waitFor(() => expect(writeIndexedDb).toHaveBeenCalled());
      await waitFor(() => expect(rendered.client.isFetching()).toBe(0));

      expect(screen.getByText("Participa como mentor")).toBeDefined();

      expect(
        screen.getByRole("heading", {
          name: "Participación",
        }),
      ).toBeDefined();

      expect(screen.getByText("Quiero participar como mentor")).toBeDefined();
    } finally {
      await act(async () => {
        rendered.unmount();
        await rendered.client.cancelQueries();
        rendered.client.clear();
      });
    }
  });
});
