import { act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { jobOffersService } from "../services/job-offers.service";
import { DOCKER, PYTHON } from "../testing/vacancy-fixtures";
import { useRequirementsSkillsPreview } from "./use-requirements-skills-preview";

vi.mock("../services/job-offers.service", () => ({
  jobOffersService: { detectRequirementSkills: vi.fn() },
}));

async function advanceTime(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(jobOffersService.detectRequirementSkills).mockReset();
  vi.mocked(jobOffersService.detectRequirementSkills).mockResolvedValue([PYTHON]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useRequirementsSkillsPreview", () => {
  it("espera 500 ms sin cambios y detecta solo el último texto sin espacios sobrantes", async () => {
    const { result, rerender } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });

    await advanceTime(250);
    rerender("  Python y Docker  ");
    await advanceTime(499);
    expect(jobOffersService.detectRequirementSkills).not.toHaveBeenCalled();

    await advanceTime(1);
    expect(jobOffersService.detectRequirementSkills).toHaveBeenCalledExactlyOnceWith("Python y Docker");
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([PYTHON]);
    expect(result.current.processingTimeMs).toEqual(expect.any(Number));
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("no consulta nada mientras la descripción está vacía", async () => {
    const { result } = renderHook(useRequirementsSkillsPreview, { initialProps: "   " });

    await advanceTime(2000);

    expect(jobOffersService.detectRequirementSkills).not.toHaveBeenCalled();
    expect(result.current.detectedSkills).toEqual([]);
    expect(result.current.processingTimeMs).toBeUndefined();
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("indica que está analizando mientras el backend responde", async () => {
    let resolveDetection: (skills: (typeof PYTHON)[]) => void = () => undefined;
    vi.mocked(jobOffersService.detectRequirementSkills).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDetection = resolve;
      }),
    );
    const { result } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });

    await advanceTime(500);
    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      resolveDetection([PYTHON]);
    });
    await advanceTime(1);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.detectedSkills).toEqual([PYTHON]);
  });

  it("conserva las habilidades detectadas mientras se escribe y las reemplaza con el nuevo resultado", async () => {
    vi.mocked(jobOffersService.detectRequirementSkills).mockResolvedValueOnce([PYTHON]).mockResolvedValueOnce([DOCKER]);
    const { result, rerender } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([PYTHON]);

    rerender("Docker");
    expect(result.current.detectedSkills).toEqual([PYTHON]);

    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([DOCKER]);
  });

  it("no reemplaza el resultado nuevo cuando una respuesta anterior llega tarde", async () => {
    let resolveOlder: (skills: (typeof PYTHON)[]) => void = () => undefined;
    vi.mocked(jobOffersService.detectRequirementSkills)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOlder = resolve;
        }),
      )
      .mockResolvedValueOnce([DOCKER]);
    const { result, rerender } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });

    await advanceTime(500);
    rerender("Docker");
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([DOCKER]);

    await act(async () => {
      resolveOlder([PYTHON]);
    });
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([DOCKER]);
  });

  it("limpia las habilidades al vaciar la descripción", async () => {
    const { result, rerender } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });
    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.detectedSkills).toEqual([PYTHON]);

    rerender("   ");

    expect(result.current.detectedSkills).toEqual([]);
    expect(result.current.processingTimeMs).toBeUndefined();
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("expone el error sin reintentar", async () => {
    vi.mocked(jobOffersService.detectRequirementSkills).mockRejectedValue(new Error("Unavailable"));
    const { result } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });

    await advanceTime(500);
    await advanceTime(1);
    expect(result.current.isError).toBe(true);
    expect(result.current.detectedSkills).toEqual([]);
    expect(result.current.isAnalyzing).toBe(false);

    await advanceTime(5000);
    expect(jobOffersService.detectRequirementSkills).toHaveBeenCalledTimes(1);
  });

  it("cancela la consulta programada al salir del paso", async () => {
    const { unmount } = renderHook(useRequirementsSkillsPreview, { initialProps: "Python" });

    await advanceTime(250);
    unmount();
    await advanceTime(500);

    expect(jobOffersService.detectRequirementSkills).not.toHaveBeenCalled();
  });
});
