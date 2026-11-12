import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const PAYLOAD: WorkExperiencePayload = {
  companyName: "Synapse Labs",
  position: "Desarrolladora web junior",
  startDate: "2025-03-01",
  endDate: null,
  isCurrent: true,
  description: "Desarrollo con Python y Scrum",
};

const SAVED: WorkExperienceItem = {
  id: "experience-1",
  ...PAYLOAD,
};

describe("useSaveWorkExperience", () => {
  beforeEach(() => {
    vi.mocked(workExperienceService.createWorkExperience).mockResolvedValue(
      SAVED,
    );

    vi.mocked(workExperienceService.updateWorkExperience).mockResolvedValue(
      SAVED,
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("creates the experience keeping the description as typed", async () => {
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

    expect(result.current.isSaving).toBe(false);
  });

  it("preserves capitalization, accents and punctuation in the description", async () => {
    const description =
      "Lideré APIs en Node.js, C++ y C#. ¡Gestión de proyectos!";

    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() =>
      result.current.save({
        ...PAYLOAD,
        description,
      }),
    );

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith({
      ...PAYLOAD,
      description,
    });
  });

  it("updates the experience and preserves a null description", async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() =>
      result.current.save(
        {
          ...PAYLOAD,
          description: null,
        },
        "experience-1",
      ),
    );

    expect(workExperienceService.updateWorkExperience).toHaveBeenCalledWith(
      "experience-1",
      {
        ...PAYLOAD,
        description: null,
      },
    );

    expect(result.current.feedback).toEqual({
      type: "success",
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateSuccess,
    });
  });

  it("refreshes the skills queries after saving", async () => {
    const { result, client } = renderHook(() =>
      useSaveWorkExperience(vi.fn()),
    );

    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(() => result.current.save(PAYLOAD));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["skills", "profile"],
      });

      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["profile", "skills-radar"],
      });
    });
  });

  it("keeps the experience saved and shows success feedback", async () => {
    const onSaved = vi.fn();

    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith(
      PAYLOAD,
    );

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.feedback?.type).toBe("success");
  });

  it("does not refresh skills when the experience could not be saved", async () => {
    vi.mocked(workExperienceService.createWorkExperience).mockRejectedValue(
      new Error("fail"),
    );

    const onSaved = vi.fn();

    const { result, client } = renderHook(() =>
      useSaveWorkExperience(onSaved),
    );

    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(() => result.current.save(PAYLOAD));

    expect(onSaved).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();

    expect(result.current.feedback).toEqual({
      type: "error",
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.createError,
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("clears the feedback", async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() => result.current.save(PAYLOAD));

    expect(result.current.feedback).not.toBeNull();

    act(() => result.current.clearFeedback());

    expect(result.current.feedback).toBeNull();
  });
});
