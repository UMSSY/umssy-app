import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CvExportButton } from "./cv-export-button";

vi.mock("@/modules/profile/services/profile.service", () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("../services/documents.service", () => ({
  documentsService: {
    generateCv: vi.fn(),
  },
}));

describe("CvExportButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the action without opening the dialog", () => {
    render(<CvExportButton />);

    expect(screen.getByRole("button", { name: "Descargar CV en PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the cv generation dialog and closes it again", async () => {
    const user = userEvent.setup();
    render(<CvExportButton />);

    await user.click(screen.getByRole("button", { name: "Descargar CV en PDF" }));

    expect(await screen.findByRole("dialog", { name: "Generar CV profesional" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
