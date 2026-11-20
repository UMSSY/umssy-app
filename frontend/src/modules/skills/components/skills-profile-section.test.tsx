import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { MY_SKILLS_QUERY_KEY } from "../constants/skills.constants";
import { skillsService } from "../services/skills.service";
import { SkillsProfileSection } from "./skills-profile-section";

vi.mock("../services/skills.service", () => ({ skillsService: { getCatalog: vi.fn(), getMySkills: vi.fn(), createCustomSkill: vi.fn(), saveMySkills: vi.fn() } }));
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

  it("shows the X only on the skills that the user added by hand (AC-10.1, AC-10.2)", async () => {
    vi.mocked(skillsService.getMySkills).mockResolvedValue([
      { id: "python", name: "Python", origins: ["manual"] },
      { id: "sql", name: "SQL", origins: ["manual", "experience"] },
      { id: "docker", name: "Docker", origins: ["experience"] },
      { id: "java", name: "Java", origins: ["cv"] },
    ]);
    render(<SkillsProfileSection />);
    await screen.findByText("Python");
    expect(screen.getByRole("button", { name: "Quitar Python" })).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar Docker" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar Java" })).not.toBeInTheDocument();
  });

  it("removes a manual skill without touching the ones backed by experiences or the CV (AC-10.3)", async () => {
    const manual = { id: "python", name: "Python", origins: ["manual" as const] };
    const fromExperience = { id: "sql", name: "SQL", origins: ["manual" as const, "experience" as const] };
    const fromCv = { id: "java", name: "Java", origins: ["cv" as const] };
    vi.mocked(skillsService.getMySkills).mockResolvedValue([manual, fromExperience, fromCv]);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([fromExperience, fromCv]);
    const user = userEvent.setup();
    render(<SkillsProfileSection />);
    await screen.findByText("Python");
    await user.click(screen.getByRole("button", { name: "Quitar Python" }));
    await waitFor(() => expect(screen.queryByText("Python")).not.toBeInTheDocument());
    expect(skillsService.saveMySkills).toHaveBeenCalledWith([fromExperience.id]);
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
  });

  it("drops the X when an experience that contains a manual skill is saved (AC-10.4)", async () => {
    vi.mocked(skillsService.getMySkills).mockResolvedValueOnce([{ id: "sql", name: "SQL", origins: ["manual"] }]);
    const { client } = render(<SkillsProfileSection />);
    expect(await screen.findByRole("button", { name: "Quitar SQL" })).toBeInTheDocument();
    vi.mocked(skillsService.getMySkills).mockResolvedValue([
      { id: "sql", name: "SQL", origins: ["manual", "experience"] },
    ]);
    await act(() => client.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument());
    expect(screen.getByText("SQL")).toBeInTheDocument();
  });

  it("brings the X back when the only experience of a manual skill is deleted (AC-10.5)", async () => {
    vi.mocked(skillsService.getMySkills).mockResolvedValueOnce([
      { id: "sql", name: "SQL", origins: ["manual", "experience"] },
    ]);
    const { client } = render(<SkillsProfileSection />);
    await screen.findByText("SQL");
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
    vi.mocked(skillsService.getMySkills).mockResolvedValue([{ id: "sql", name: "SQL", origins: ["manual"] }]);
    await act(() => client.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY }));
    expect(await screen.findByRole("button", { name: "Quitar SQL" })).toBeInTheDocument();
  });

  it("keeps the chip without X while another experience still backs the skill (AC-10.6)", async () => {
    vi.mocked(skillsService.getMySkills).mockResolvedValueOnce([{ id: "sql", name: "SQL", origins: ["experience"] }]);
    const { client } = render(<SkillsProfileSection />);
    await screen.findByText("SQL");
    vi.mocked(skillsService.getMySkills).mockResolvedValue([{ id: "sql", name: "SQL", origins: ["experience"] }]);
    await act(() => client.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY }));
    await screen.findByText("SQL");
    expect(screen.queryByRole("button", { name: "Quitar SQL" })).not.toBeInTheDocument();
  });
});
