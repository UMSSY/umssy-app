import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { SKILLS_PROFILE_QUERY_KEY } from "../constants/skills.constants";
import { skillsService } from "../services/skills.service";
import { SkillsProfileSection } from "./skills-profile-section";

vi.mock("../services/skills.service", () => ({ skillsService: { getCatalog: vi.fn(), getMySkills: vi.fn(), createCustomSkill: vi.fn(), saveMySkills: vi.fn(), removeMySkill: vi.fn() } }));
vi.mock("./detected-skills-panel", () => ({ DetectedSkillsPanel: () => <div data-testid="detected-skills-panel" /> }));
const PYTHON = { id: "python", name: "Python" };
const SQL = { id: "sql", name: "SQL" };
beforeEach(() => { vi.mocked(skillsService.getCatalog).mockResolvedValue([PYTHON, SQL]); vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("SkillsProfileSection", () => {
  it("renders exactly one detected skills panel", () => {
    render(<SkillsProfileSection />);
    expect(screen.getAllByTestId("detected-skills-panel")).toHaveLength(1);
  });

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

  describe("HU-10 chips by origin", () => {
    const MANUAL = { id: "rust", name: "Rust", origin: "manual" as const, linkedExperienceCount: 0, isRemovable: true };
    const LINKED = { id: "python", name: "Python", origin: "experience" as const, linkedExperienceCount: 1, isRemovable: false };

    it("AC-10.1 and AC-10.2: only the manual skill without links shows the X", async () => {
      vi.mocked(skillsService.getMySkills).mockResolvedValue([LINKED, MANUAL]);
      render(<SkillsProfileSection />);
      await screen.findByText("Python");

      expect(screen.queryByRole("button", { name: "Quitar Python" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Quitar Rust" })).toBeInTheDocument();
    });

    it("AC-10.3: removing a manual skill uses the delete endpoint and drops the chip", async () => {
      const user = userEvent.setup();
      vi.mocked(skillsService.getMySkills).mockResolvedValue([LINKED, MANUAL]);
      vi.mocked(skillsService.removeMySkill).mockResolvedValue([LINKED]);
      render(<SkillsProfileSection />);
      await user.click(await screen.findByRole("button", { name: "Quitar Rust" }));

      await waitFor(() => expect(screen.queryByText("Rust")).not.toBeInTheDocument());
      expect(skillsService.removeMySkill).toHaveBeenCalledWith("rust");
      expect(skillsService.saveMySkills).not.toHaveBeenCalled();
    });

    it("AC-10.4, AC-10.5 and AC-10.6: the chip follows the origin after experiences are saved or deleted", async () => {
      vi.mocked(skillsService.getMySkills).mockResolvedValue([MANUAL]);
      const { client } = render(<SkillsProfileSection />);
      expect(await screen.findByRole("button", { name: "Quitar Rust" })).toBeInTheDocument();

      // AC-10.4: saving an experience that contains the skill links it, so the X disappears.
      vi.mocked(skillsService.getMySkills).mockResolvedValue([{ ...MANUAL, origin: "experience", linkedExperienceCount: 1, isRemovable: false }]);
      await act(() => client.invalidateQueries({ queryKey: SKILLS_PROFILE_QUERY_KEY }));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Quitar Rust" })).not.toBeInTheDocument());

      // AC-10.5: deleting the only linked experience returns the X.
      vi.mocked(skillsService.getMySkills).mockResolvedValue([MANUAL]);
      await act(() => client.invalidateQueries({ queryKey: SKILLS_PROFILE_QUERY_KEY }));
      expect(await screen.findByRole("button", { name: "Quitar Rust" })).toBeInTheDocument();

      // AC-10.6: with two experiences, deleting one keeps the chip without X.
      vi.mocked(skillsService.getMySkills).mockResolvedValue([{ ...MANUAL, origin: "experience", linkedExperienceCount: 1, isRemovable: false }]);
      await act(() => client.invalidateQueries({ queryKey: SKILLS_PROFILE_QUERY_KEY }));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Quitar Rust" })).not.toBeInTheDocument());
      expect(screen.getByText("Rust")).toBeInTheDocument();
    });

    it("shows an error and keeps the chip when the server rejects the removal", async () => {
      const user = userEvent.setup();
      vi.mocked(skillsService.getMySkills).mockResolvedValue([MANUAL]);
      vi.mocked(skillsService.removeMySkill).mockRejectedValue({ response: { status: 409 } });
      render(<SkillsProfileSection />);
      await user.click(await screen.findByRole("button", { name: "Quitar Rust" }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Rust")).toBeInTheDocument();
    });
  });
});
