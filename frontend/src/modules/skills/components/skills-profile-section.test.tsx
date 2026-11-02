import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { skillsService } from "../services/skills.service";
import { SkillsProfileSection } from "./skills-profile-section";

vi.mock("../services/skills.service", () => ({ skillsService: { getCatalog: vi.fn(), getMySkills: vi.fn(), createCustomSkill: vi.fn(), saveMySkills: vi.fn() } }));
const PYTHON = { id: "python", name: "Python" };
const SQL = { id: "sql", name: "SQL" };
beforeEach(() => { vi.mocked(skillsService.getCatalog).mockResolvedValue([PYTHON, SQL]); vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("SkillsProfileSection", () => {
  it("adds an existing skill directly and closes the small picker", async () => {
    const user = userEvent.setup();
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON, SQL]);
    render(<SkillsProfileSection />);
    await screen.findByText("Python");
    await user.click(screen.getByRole("button", { name: "Añadir habilidad" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("sm:max-w-md");
    await user.click(within(dialog).getByRole("button", { name: "Añadir SQL" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(skillsService.saveMySkills).toHaveBeenCalledWith([PYTHON.id, SQL.id]);
  });

  it("keeps a failed addition in the picker and allows retry", async () => {
    const user = userEvent.setup();
    vi.mocked(skillsService.saveMySkills).mockRejectedValueOnce(new Error("Network error")).mockResolvedValue([PYTHON, SQL]);
    render(<SkillsProfileSection />);
    await screen.findByText("Python");
    await user.click(screen.getByRole("button", { name: "Añadir habilidad" }));
    await user.click(screen.getByRole("button", { name: "Añadir SQL" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Añadir SQL" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("SQL")).toBeInTheDocument();
  });

  it("creates a missing skill in the same dialog and reuses it after a failed profile save", async () => {
    const custom = { id: "rust", name: "Rust" };
    vi.mocked(skillsService.createCustomSkill).mockResolvedValue(custom);
    vi.mocked(skillsService.saveMySkills).mockRejectedValueOnce(new Error("Network error")).mockResolvedValue([PYTHON, custom]);
    const user = userEvent.setup();
    render(<SkillsProfileSection />);
    await screen.findByText("Python");
    await user.click(screen.getByRole("button", { name: "Añadir habilidad" }));
    await user.type(screen.getByRole("textbox", { name: "Habilidad" }), "Rust");
    await user.click(screen.getByRole("button", { name: "Crear y añadir habilidad" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Añadir Rust" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Rust")).toBeInTheDocument();
    expect(skillsService.createCustomSkill).toHaveBeenCalledTimes(1);
    expect(skillsService.saveMySkills).toHaveBeenLastCalledWith([PYTHON.id, custom.id]);
  });
});
