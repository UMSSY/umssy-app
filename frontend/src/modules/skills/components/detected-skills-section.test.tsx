import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { profileSkillsRadarService } from "@/modules/profile/services/profile-skills-radar.service";
import type { ProfileSkillsRadarResponse } from "@/modules/profile/types/profile-skills-radar-response.types";
import type { ProfileSkillsAnalysisResponse } from "@/modules/profile/types/profile-skills-analysis-response.types";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile/hooks/use-profile-skills-radar";
import { SKILL_ANALYSIS_TEXTS as texts } from "../constants/skill-analysis.constants";
import { DetectedSkillsSection } from "./detected-skills-section";

vi.mock("@/modules/profile/services/profile-skills-radar.service", () => ({ profileSkillsRadarService: { getSkills: vi.fn(), analyzeSkills: vi.fn() } }));

let snapshot: ProfileSkillsRadarResponse;
const python = {
  id: "python", text: "Python", name: "Python", source: "nlp" as const, areaId: null,
  verificationStatus: "pending", isHighRelevance: true,
  evidenceRefs: [{ type: "cv" as const, id: "cv1" }, { type: "certification" as const, id: "cert1" }],
};

beforeEach(() => {
  snapshot = { userId: "u1", status: "pending", version: 0, updatedAt: null, dictionaryVersion: null, skills: [] };
  vi.mocked(profileSkillsRadarService.getSkills).mockImplementation(async () => snapshot);
  vi.mocked(profileSkillsRadarService.analyzeSkills).mockImplementation(async () => {
    snapshot = { ...snapshot, status: "ready", version: 1, skills: [python] };
    return { ...snapshot, analysis: { rejectedSources: [] } };
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("DetectedSkillsSection", () => {
  it("analyzes through the real service boundary and shows combined evidence once", async () => {
    const user = userEvent.setup();
    renderWithQuery(<DetectedSkillsSection />);
    await screen.findByText(texts.pending);
    await user.click(screen.getByRole("button", { name: texts.analyze }));
    expect(await screen.findByText("Python")).toBeInTheDocument();
    expect(screen.getAllByText("Python")).toHaveLength(1);
    expect(screen.getByText("CV, Certificación")).toBeInTheDocument();
    expect(screen.getByText(texts.pendingVerification)).toBeInTheDocument();
    expect(profileSkillsRadarService.analyzeSkills).toHaveBeenCalledOnce();
  });

  it("blocks repeated clicks while the analysis is running", async () => {
    let finish!: (response: ProfileSkillsAnalysisResponse) => void;
    vi.mocked(profileSkillsRadarService.analyzeSkills).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    renderWithQuery(<DetectedSkillsSection />);
    await screen.findByText(texts.pending);
    await user.dblClick(screen.getByRole("button", { name: texts.analyze }));
    expect(screen.getByRole("button", { name: texts.analyzing })).toBeDisabled();
    expect(profileSkillsRadarService.analyzeSkills).toHaveBeenCalledOnce();
    await act(async () => { finish({ ...snapshot, analysis: { rejectedSources: [] } }); });
    await waitFor(() => expect(screen.getByRole("button", { name: texts.analyze })).toBeEnabled());
  });

  it("shows extraction errors, never a successful empty list, and allows retry", async () => {
    vi.mocked(profileSkillsRadarService.analyzeSkills).mockImplementationOnce(async () => {
      snapshot = { ...snapshot, status: "error" };
      return { ...snapshot, analysis: { rejectedSources: [{ type: "certification", id: "c1", reason: "document-unreadable", message: "Documento ilegible" }] } };
    });
    const user = userEvent.setup();
    renderWithQuery(<DetectedSkillsSection />);
    await screen.findByText(texts.pending);
    await user.click(screen.getByRole("button", { name: texts.analyze }));
    expect(await screen.findByText(texts.failed)).toBeInTheDocument();
    expect(screen.getByText(/Certificación: Documento ilegible/)).toBeInTheDocument();
    expect(screen.queryByText(texts.empty)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: texts.analyze }));
    expect(await screen.findByText("Python")).toBeInTheDocument();
    expect(screen.queryByText(texts.failed)).not.toBeInTheDocument();
  });

  it("reports request failures without exposing technical messages", async () => {
    vi.mocked(profileSkillsRadarService.analyzeSkills).mockRejectedValue(new Error("private connection details"));
    const user = userEvent.setup();
    renderWithQuery(<DetectedSkillsSection />);
    await screen.findByText(texts.pending);
    await user.click(screen.getByRole("button", { name: texts.analyze }));
    expect(await screen.findByText(texts.failed)).toBeInTheDocument();
    expect(screen.queryByText(/private connection/)).not.toBeInTheDocument();
    expect(screen.queryByText(texts.empty)).not.toBeInTheDocument();
  });

  it("distinguishes a completed empty analysis and handles absent optional evidence", async () => {
    snapshot = { ...snapshot, status: "ready", skills: [{ ...python, evidenceRefs: undefined as never }] };
    renderWithQuery(<DetectedSkillsSection />);
    expect(await screen.findByText(texts.empty)).toBeInTheDocument();
    expect(screen.queryByText(texts.failed)).not.toBeInTheDocument();
  });

  it("hides outdated evidence when a document change invalidates the query", async () => {
    snapshot = { ...snapshot, status: "ready", skills: [python] };
    const { client, unmount } = renderWithQuery(<DetectedSkillsSection />);
    await screen.findByText("Python");
    snapshot = { ...snapshot, status: "pending", skills: [] };
    await act(async () => { await client.invalidateQueries({ queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY }); });
    expect(await screen.findByText(texts.pending)).toBeInTheDocument();
    expect(screen.queryByText("Python")).not.toBeInTheDocument();
    unmount();
    snapshot = { ...snapshot, status: "ready", skills: [python] };
    renderWithQuery(<DetectedSkillsSection />);
    expect(await screen.findByText("Python")).toBeInTheDocument();
  });
});
