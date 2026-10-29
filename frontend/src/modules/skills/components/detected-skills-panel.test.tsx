import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { DETECTED_SKILLS_TEXTS } from "../constants/skills.constants";
import { skillsService } from "../services/skills.service";
import { DetectedSkillsPanel } from "./detected-skills-panel";

vi.mock("../services/skills.service", () => ({
  skillsService: { getDetectedSkills: vi.fn(), analyzeSkills: vi.fn() },
}));

const READY = {
  status: "ready" as const,
  skills: [
    { id: "docker", name: "Docker", evidenceCount: 2 },
    { id: "python", name: "Python", evidenceCount: 1 },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DetectedSkillsPanel", () => {
  it("lists the skills found in the experience with their number of records", async () => {
    vi.mocked(skillsService.getDetectedSkills).mockResolvedValue(READY);

    renderWithQuery(<DetectedSkillsPanel />);

    const list = await screen.findByRole("list", { name: DETECTED_SKILLS_TEXTS.title });
    expect(within(list).getByText("Docker")).toBeInTheDocument();
    expect(within(list).getByText("En 2 registros")).toBeInTheDocument();
    expect(within(list).getByText("En 1 registro")).toBeInTheDocument();
  });

  it.each([
    [{ status: "pending" as const, skills: [] }, DETECTED_SKILLS_TEXTS.pending],
    [{ status: "error" as const, skills: [] }, DETECTED_SKILLS_TEXTS.error],
    [{ status: "ready" as const, skills: [] }, DETECTED_SKILLS_TEXTS.empty],
  ])("explains the state of the analysis", async (summary, message) => {
    vi.mocked(skillsService.getDetectedSkills).mockResolvedValue(summary);

    renderWithQuery(<DetectedSkillsPanel />);

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("tells when the list cannot be loaded", async () => {
    vi.mocked(skillsService.getDetectedSkills).mockRejectedValue(new Error("Network error"));

    renderWithQuery(<DetectedSkillsPanel />);

    expect(await screen.findByText(DETECTED_SKILLS_TEXTS.loadError)).toBeInTheDocument();
  });

  it("runs the analysis again and shows the new result", async () => {
    const user = userEvent.setup();
    vi.mocked(skillsService.getDetectedSkills).mockResolvedValue({ status: "error", skills: [] });
    vi.mocked(skillsService.analyzeSkills).mockResolvedValue(READY);
    renderWithQuery(<DetectedSkillsPanel />);
    await screen.findByText(DETECTED_SKILLS_TEXTS.error);

    await user.click(screen.getByRole("button", { name: DETECTED_SKILLS_TEXTS.analyze }));

    expect(await screen.findByText("Docker")).toBeInTheDocument();
    expect(skillsService.analyzeSkills).toHaveBeenCalledOnce();
  });

  it("reads the list again after another change of the profile is saved", async () => {
    vi.mocked(skillsService.getDetectedSkills).mockResolvedValueOnce({ status: "ready", skills: [] }).mockResolvedValue(READY);
    const { client } = renderWithQuery(<DetectedSkillsPanel />);
    await screen.findByText(DETECTED_SKILLS_TEXTS.empty);

    await act(async () => {
      await client.getMutationCache().build(client, { mutationFn: () => Promise.resolve("saved") }).execute(undefined);
    });

    await waitFor(() => expect(screen.getByText("Docker")).toBeInTheDocument());
    expect(skillsService.getDetectedSkills).toHaveBeenCalledTimes(2);
  });

  it("does not read the list again after a failed save or its own analysis", async () => {
    vi.mocked(skillsService.getDetectedSkills).mockResolvedValue({ status: "ready", skills: [] });
    vi.mocked(skillsService.analyzeSkills).mockResolvedValue({ status: "ready", skills: [] });
    const user = userEvent.setup();
    const { client } = renderWithQuery(<DetectedSkillsPanel />);
    await screen.findByText(DETECTED_SKILLS_TEXTS.empty);

    await act(async () => {
      await client.getMutationCache().build(client, { mutationFn: () => Promise.reject(new Error("Network")) })
        .execute(undefined)
        .catch(() => undefined);
    });
    await user.click(screen.getByRole("button", { name: DETECTED_SKILLS_TEXTS.analyze }));
    await waitFor(() => expect(skillsService.analyzeSkills).toHaveBeenCalledOnce());

    expect(skillsService.getDetectedSkills).toHaveBeenCalledOnce();
  });
});
