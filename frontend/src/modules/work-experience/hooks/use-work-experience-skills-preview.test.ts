import { act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { skillsAnalysisService, type SkillsAnalysisResult } from "@/modules/matching";
import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import type { WorkExperienceSkillsPreviewOptions } from "../types/work-experience-skills-preview-options.types";
import { useWorkExperienceSkillsPreview } from "./use-work-experience-skills-preview";

vi.mock("@/modules/matching/services/skills-analysis.service", () => ({
  skillsAnalysisService: { previewExperience: vi.fn() },
}));

const REACT_PREVIEW: SkillsAnalysisResult = {
  experienceId: "experience-1",
  skills: [{ id: "react", name: "React" }],
  processingTimeMs: 120,
};

async function advanceTime(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(skillsAnalysisService.previewExperience).mockReset();
  vi.mocked(skillsAnalysisService.previewExperience).mockResolvedValue(REACT_PREVIEW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useWorkExperienceSkillsPreview", () => {
  it("waits for 500ms without edits and previews only the latest trimmed text", async () => {
    const initialProps: WorkExperienceSkillsPreviewOptions = {
      experienceId: "experience-1",
      description: "Python",
    };
    const { result, rerender } = renderHook(useWorkExperienceSkillsPreview, { initialProps });

    await advanceTime(250);
    rerender({ ...initialProps, description: "  React  " });
    await advanceTime(499);
    expect(skillsAnalysisService.previewExperience).not.toHaveBeenCalled();

    await advanceTime(1);
    expect(skillsAnalysisService.previewExperience).toHaveBeenCalledExactlyOnceWith("experience-1", "React");
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual(REACT_PREVIEW.skills);
    expect(result.current.processingTimeMs).toBe(120);
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("does not replace a newer preview when an older request finishes later", async () => {
    let resolveOlder: (value: SkillsAnalysisResult) => void = () => undefined;
    vi.mocked(skillsAnalysisService.previewExperience).mockReturnValueOnce(
      new Promise((resolve) => { resolveOlder = resolve; }),
    );
    const initialProps: WorkExperienceSkillsPreviewOptions = {
      experienceId: "experience-1",
      description: "Python",
    };
    const { result, rerender } = renderHook(useWorkExperienceSkillsPreview, { initialProps });

    await advanceTime(500);
    expect(result.current.isAnalyzing).toBe(true);
    rerender({ ...initialProps, description: "React" });
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual(REACT_PREVIEW.skills);

    await act(async () => {
      resolveOlder({ ...REACT_PREVIEW, skills: [{ id: "python", name: "Python" }] });
    });
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual(REACT_PREVIEW.skills);
  });

  it("clears the chips immediately when the text is emptied during a request", async () => {
    let resolvePreview: (value: SkillsAnalysisResult) => void = () => undefined;
    vi.mocked(skillsAnalysisService.previewExperience).mockReturnValueOnce(
      new Promise((resolve) => { resolvePreview = resolve; }),
    );
    const initialProps: WorkExperienceSkillsPreviewOptions = {
      experienceId: "experience-1",
      description: "React",
      initialSkills: [{ id: "python", name: "Python" }],
    };
    const { result, rerender } = renderHook(useWorkExperienceSkillsPreview, { initialProps });

    await advanceTime(500);
    rerender({ ...initialProps, description: "   " });
    expect(result.current.detectedSkills).toEqual([]);
    expect(result.current.processingTimeMs).toBeUndefined();
    expect(result.current.isAnalyzing).toBe(false);

    await act(async () => { resolvePreview(REACT_PREVIEW); });
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([]);
    expect(skillsAnalysisService.previewExperience).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved skills and exposes the query error without retrying", async () => {
    vi.mocked(skillsAnalysisService.previewExperience).mockRejectedValue(new Error("Unavailable"));
    const initialSkills = [{ id: "python", name: "Python" }];
    const { result } = renderHook(() => useWorkExperienceSkillsPreview({
      experienceId: "experience-1",
      description: "Python",
      initialSkills,
    }));

    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual(initialSkills);
    expect(result.current.isError).toBe(true);
    expect(result.current.isAnalyzing).toBe(false);
    await advanceTime(5000);
    expect(skillsAnalysisService.previewExperience).toHaveBeenCalledTimes(1);
  });

  it("does not reuse the chips of another experience", async () => {
    const initialProps: WorkExperienceSkillsPreviewOptions = {
      experienceId: "experience-1",
      description: "React",
    };
    const { result, rerender } = renderHook(useWorkExperienceSkillsPreview, { initialProps });
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual(REACT_PREVIEW.skills);

    rerender({
      experienceId: "experience-2",
      description: "Python",
      initialSkills: [{ id: "python", name: "Python" }],
    });
    expect(result.current.detectedSkills).toEqual([{ id: "python", name: "Python" }]);
    expect(result.current.processingTimeMs).toBeUndefined();
    expect(skillsAnalysisService.previewExperience).toHaveBeenCalledTimes(1);
  });

  it("cancels the scheduled request when the editor is closed", async () => {
    const { unmount } = renderHook(() => useWorkExperienceSkillsPreview({
      experienceId: "experience-1",
      description: "React",
    }));
    await advanceTime(250);
    unmount();
    await advanceTime(500);
    expect(skillsAnalysisService.previewExperience).not.toHaveBeenCalled();
  });
});
