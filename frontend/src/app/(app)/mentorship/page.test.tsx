import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { mentorParticipationService } from "@/modules/mentors/services/mentor-participation.service";
import {
  clearAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import MentorshipPage from "./page";

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
  beforeEach(() => {
    saveAccessToken("mentor-token");
    vi.spyOn(mentorParticipationService, "getMyParticipation").mockResolvedValue({
      status: "NEVER",
      areas: [],
      orientations: [],
    });
    vi.spyOn(mentorParticipationService, "getCurrent").mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    clearAccessToken();
    vi.restoreAllMocks();
  });

  it("renderiza el formulario para un usuario autenticado sin solicitud vigente", async () => {
    const rendered = renderWithQuery(<MentorshipPage />);

    try {
      expect(await screen.findByText("Participa como mentor")).toBeInTheDocument();
      expect(mentorParticipationService.getMyParticipation).toHaveBeenCalled();
      expect(mentorParticipationService.getCurrent).toHaveBeenCalled();
      expect(screen.queryByText("Verificando tu participación...")).not.toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          name: "Participación",
        }),
      ).toBeInTheDocument();

      expect(screen.getByRole("checkbox", { name: "Quiero participar como mentor" })).toBeInTheDocument();
    } finally {
      await act(async () => {
        rendered.unmount();
        await rendered.client.cancelQueries();
        rendered.client.clear();
      });
    }
  });
});
