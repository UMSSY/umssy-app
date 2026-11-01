
import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { skillsAnalysisService } from "@/modules/matching/services/skills-analysis.service";
import { profileSkillsRadarService } from "@/modules/profile/services/profile-skills-radar.service";
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from "../config/work-experience-feedback.config";
import { workExperienceService } from "../services/work-experience.service";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import type { WorkExperiencePayload } from "../types/work-experience-payload.types";
import { useSaveWorkExperience } from "./use-save-work-experience";

vi.mock("../services/work-experience.service", () => ({
  workExperienceService: {
    createWorkExperience: vi.fn(),
    updateWorkExperience: vi.fn(),
  },
}));

vi.mock("@/modules/matching/services/skills-analysis.service", () => ({
  skillsAnalysisService: {
    analyzeExperience: vi.fn(),
  },
}));

vi.mock("@/modules/profile/services/profile-skills-radar.service", () => ({
  profileSkillsRadarService: {
    analyzeSkills: vi.fn(),
    getSkills: vi.fn(),
  },
}));

const PAYLOAD: WorkExperiencePayload = {
  companyName: "Synapse Labs",
  position: "Desarrolladora web junior",
  startDate: "2025-03-01",
  endDate: null,
  isCurrent: true,
  description: "Desarrollo con Python y Scrum",
};

const SAVED: WorkExperienceItem = { id: "experience-1", ...PAYLOAD };

const ANALYSIS = {
  experienceId: "experience-1",
  skills: [
    { id: "skill-1", name: "Python" },
    { id: "skill-2", name: "Scrum" },
  ],
  processingTimeMs: 320,
};

describe("useSaveWorkExperience", () => {
  beforeEach(() => {
    vi.mocked(workExperienceService.createWorkExperience).mockResolvedValue(
      SAVED,
    );
    vi.mocked(workExperienceService.updateWorkExperience).mockResolvedValue(
      SAVED,
    );
    vi.mocked(skillsAnalysisService.analyzeExperience).mockResolvedValue(
      ANALYSIS,
    );
    vi.mocked(profileSkillsRadarService.analyzeSkills).mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("creates the experience and analyzes its description after saving (AC-01.1)", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith(
      PAYLOAD,
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.feedback).toEqual({
      type: "success",
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.createSuccess,
    });

    await waitFor(() => expect(result.current.analysis).toEqual(ANALYSIS));

    expect(skillsAnalysisService.analyzeExperience).toHaveBeenCalledWith(
      "experience-1",
      "Desarrollo con Python y Scrum",
    );

    await waitFor(() =>
      expect(profileSkillsRadarService.analyzeSkills).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));
  });

  it("updates the experience and analyzes it again with the new description", async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() =>
      result.current.save({ ...PAYLOAD, description: null }, "experience-1"),
    );

    expect(workExperienceService.updateWorkExperience).toHaveBeenCalledWith(
      "experience-1",
      {
        ...PAYLOAD,
        description: null,
      },
    );

    await waitFor(() =>
      expect(skillsAnalysisService.analyzeExperience).toHaveBeenCalledWith(
        "experience-1",
        null,
      ),
    );

    await waitFor(() =>
      expect(profileSkillsRadarService.analyzeSkills).toHaveBeenCalledTimes(1),
    );
  });

  it("refreshes the skills queries after the analysis", async () => {
    const { result, client } = renderHook(() =>
      useSaveWorkExperience(vi.fn()),
    );
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(() => result.current.save(PAYLOAD));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["skills", "profile"],
      }),
    );

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["profile", "skills-radar"],
      }),
    );
  });

  it("keeps the saved experience when the individual analysis fails (AC-01.9)", async () => {
    vi.mocked(skillsAnalysisService.analyzeExperience).mockRejectedValue(
      new Error("fail"),
    );

    const onSaved = vi.fn();
    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    await waitFor(() =>
      expect(profileSkillsRadarService.analyzeSkills).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.analysis).toBeNull();
    expect(result.current.feedback?.type).toBe("success");
  });

  it("does not analyze when the experience could not be saved", async () => {
    vi.mocked(workExperienceService.createWorkExperience).mockRejectedValue(
      new Error("fail"),
    );

    const onSaved = vi.fn();
    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    expect(onSaved).not.toHaveBeenCalled();
    expect(skillsAnalysisService.analyzeExperience).not.toHaveBeenCalled();
    expect(profileSkillsRadarService.analyzeSkills).not.toHaveBeenCalled();
    expect(result.current.feedback).toEqual({
      type: "error",
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.createError,
    });
  });

  it("clears the feedback and the detected skills", async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() => result.current.save(PAYLOAD));
    await waitFor(() => expect(result.current.analysis).toEqual(ANALYSIS));

    act(() => result.current.clearFeedback());

    expect(result.current.feedback).toBeNull();
    expect(result.current.analysis).toBeNull();
  });
});
