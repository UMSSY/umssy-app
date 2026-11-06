import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { useQuery } from "@tanstack/react-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { skillsService } from "../services/skills.service";
import { useSkills } from "./use-skills";

vi.mock("../services/skills.service", () => ({
  skillsService: {
    getCatalog: vi.fn(),
    getMySkills: vi.fn(),
    createCustomSkill: vi.fn(),
    saveMySkills: vi.fn(),
  },
}));

const PYTHON = { id: "33333333-3333-4333-8333-333333333333", name: "Python" };
const SQL = { id: "44444444-4444-4444-8444-444444444444", name: "SQL" };
const DOCKER = { id: "55555555-5555-4555-8555-555555555555", name: "Docker" };

async function renderLoadedHook() {
  const hook = renderHook(() => useSkills());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe("useSkills", () => {
  beforeEach(() => {
    vi.mocked(skillsService.getCatalog).mockResolvedValue([PYTHON, SQL]);
    vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads the catalog and the saved skills of the user", async () => {
    const { result } = await renderLoadedHook();

    expect(result.current.catalogSkills).toEqual([PYTHON, SQL]);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
    expect(result.current.feedback).toBeNull();
  });

  it("shows an error message when the skills cannot be loaded", async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue({ response: { status: 401 } });

    const { result } = await renderLoadedHook();

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.feedback).toEqual({
      type: "error",
      message: "Tu sesión no es válida. Inicia sesión nuevamente.",
    });
  });

  it("blocks saving and mutations when initial load fails", async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue(new Error("Network Error"));

    const { result } = await renderLoadedHook();

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.selectedSkills).toEqual([]);

    act(() => result.current.addSkill(SQL));
    expect(result.current.selectedSkills).toEqual([]);

    act(() => result.current.createCustomSkill("Docker"));
    expect(result.current.selectedSkills).toEqual([]);

    await act(() => result.current.saveSkills());
    expect(skillsService.saveMySkills).not.toHaveBeenCalled();
  });

  it("reloads the catalog and user skills when reload is called", async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValueOnce(new Error("Network Error"));

    const { result } = await renderLoadedHook();
    expect(result.current.hasLoadError).toBe(true);

    vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]);
    await act(() => result.current.reload());

    expect(result.current.hasLoadError).toBe(false);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
  });

  it("does not update the state after unmounting", async () => {
    const { unmount } = renderHook(() => useSkills());
    unmount();

    await waitFor(() => expect(skillsService.getMySkills).toHaveBeenCalled());
  });

  it("does not update the state when loading fails after unmounting", async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue(new Error("Network Error"));
    const { unmount } = renderHook(() => useSkills());
    unmount();

    await waitFor(() => expect(skillsService.getMySkills).toHaveBeenCalled());
  });

  it("adds a skill only once and removes it without affecting the others", async () => {
    const { result } = await renderLoadedHook();

    act(() => result.current.addSkill(SQL));
    act(() => result.current.addSkill(SQL));
    expect(result.current.selectedSkills).toEqual([PYTHON, SQL]);

    act(() => result.current.removeSkill(PYTHON.id));
    expect(result.current.selectedSkills).toEqual([SQL]);
  });

  it("registers the pending custom skills before saving the whole list", async () => {
    vi.mocked(skillsService.createCustomSkill).mockResolvedValue(DOCKER);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([DOCKER, PYTHON]);
    const { result } = await renderLoadedHook();

    act(() => result.current.createCustomSkill("Docker"));
    expect(result.current.selectedSkills).toEqual([PYTHON, { id: "pending-docker", name: "Docker" }]);

    await act(() => result.current.saveSkills());

    expect(skillsService.createCustomSkill).toHaveBeenCalledWith("Docker");
    expect(skillsService.saveMySkills).toHaveBeenCalledWith([PYTHON.id, DOCKER.id]);
    expect(result.current.selectedSkills).toEqual([DOCKER, PYTHON]);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.feedback).toEqual({
      type: "success",
      message: "Tus habilidades se guardaron correctamente.",
    });
  });

  it("does not send the same id twice when a custom skill reuses a selected one", async () => {
    vi.mocked(skillsService.createCustomSkill).mockResolvedValue(PYTHON);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON]);
    const { result } = await renderLoadedHook();

    act(() => result.current.createCustomSkill("Python"));
    await act(() => result.current.saveSkills());

    expect(skillsService.saveMySkills).toHaveBeenCalledWith([PYTHON.id]);
  });

  it("shows an error message when saving fails", async () => {
    vi.mocked(skillsService.saveMySkills).mockRejectedValue({ response: { status: 409 } });
    const { result } = await renderLoadedHook();

    await act(() => result.current.saveSkills());

    expect(result.current.feedback).toEqual({
      type: "error",
      message: "No puedes agregar la misma habilidad dos veces.",
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("clears the feedback when the selection changes", async () => {
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON]);
    const { result } = await renderLoadedHook();

    await act(() => result.current.saveSkills());
    act(() => result.current.addSkill(SQL));

    expect(result.current.feedback).toBeNull();
  });

  it("blocks mutations (add, remove, custom create) while saveSkills is pending", async () => {
    let resolveSave!: (value: typeof PYTHON[]) => void;
    const savePromise = new Promise<typeof PYTHON[]>((resolve) => {
      resolveSave = resolve;
    });
    vi.mocked(skillsService.saveMySkills).mockReturnValue(savePromise);

    const { result } = await renderLoadedHook();
    expect(result.current.selectedSkills).toEqual([PYTHON]);

    let saveActionPromise: Promise<boolean> | undefined;
    act(() => {
      saveActionPromise = result.current.saveSkills();
    });
    expect(result.current.isSaving).toBe(true);

    act(() => {
      result.current.addSkill(SQL);
      result.current.removeSkill(PYTHON.id);
      result.current.createCustomSkill("Docker");
    });

    expect(result.current.selectedSkills).toEqual([PYTHON]);

    await act(async () => {
      resolveSave([PYTHON]);
      await saveActionPromise;
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
  });

  describe("automatic consolidated skills refresh", () => {
    const consolidatedQueryKey = ["profile", "skills-radar"] as const;

    async function renderConsolidatedSkills() {
      const readConsolidated = vi.fn().mockResolvedValue([PYTHON]);
      const hook = renderHook(() => ({
        skills: useSkills(),
        consolidated: useQuery({
          queryKey: consolidatedQueryKey,
          queryFn: readConsolidated,
          staleTime: Infinity,
        }),
      }));
      await waitFor(() => {
        expect(hook.result.current.skills.isLoading).toBe(false);
        expect(hook.result.current.consolidated.data).toEqual([PYTHON]);
      });
      return { ...hook, readConsolidated };
    }

    it.each([
      { action: "adding a skill", selection: [PYTHON, SQL] },
      { action: "replacing a skill", selection: [SQL] },
      { action: "removing every manual skill", selection: [] },
    ])("refreshes the consolidated list after $action", async ({ selection }) => {
      const { result, readConsolidated } = await renderConsolidatedSkills();
      vi.mocked(skillsService.saveMySkills).mockImplementation(async () => {
        readConsolidated.mockResolvedValue(selection);
        return selection;
      });

      await act(async () => {
        expect(await result.current.skills.saveSkills(selection)).toBe(true);
      });

      await waitFor(() => expect(result.current.consolidated.data).toEqual(selection));
      expect(readConsolidated).toHaveBeenCalledTimes(2);
      expect(result.current.skills.selectedSkills).toEqual(selection);
    });

    it("keeps the previous consolidated list while the save is pending", async () => {
      const { result, readConsolidated } = await renderConsolidatedSkills();
      let resolveSave!: (value: typeof PYTHON[]) => void;
      vi.mocked(skillsService.saveMySkills).mockReturnValue(new Promise((resolve) => {
        resolveSave = resolve;
      }));
      let saved!: Promise<boolean>;

      act(() => { saved = result.current.skills.saveSkills([PYTHON, SQL]); });

      expect(readConsolidated).toHaveBeenCalledTimes(1);
      expect(result.current.consolidated.data).toEqual([PYTHON]);

      await act(async () => {
        readConsolidated.mockResolvedValue([PYTHON, SQL]);
        resolveSave([PYTHON, SQL]);
        await saved;
      });
      await waitFor(() => expect(result.current.consolidated.data).toEqual([PYTHON, SQL]));
    });

    it("preserves the consolidated cache when saving fails", async () => {
      const { result, client, readConsolidated } = await renderConsolidatedSkills();
      vi.mocked(skillsService.saveMySkills).mockRejectedValue(new Error("Save failed"));

      await act(async () => {
        expect(await result.current.skills.saveSkills([PYTHON, SQL])).toBe(false);
      });

      expect(result.current.consolidated.data).toEqual([PYTHON]);
      expect(readConsolidated).toHaveBeenCalledTimes(1);
      expect(client.getQueryState(consolidatedQueryKey)?.isInvalidated).toBe(false);
    });

    it("marks an inactive consolidated list as stale for the next visit", async () => {
      const { result, client } = await renderLoadedHook();
      client.setQueryData(consolidatedQueryKey, [PYTHON]);
      vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON, SQL]);

      await act(async () => {
        expect(await result.current.saveSkills([PYTHON, SQL])).toBe(true);
      });

      expect(client.getQueryState(consolidatedQueryKey)?.isInvalidated).toBe(true);
    });

    it("keeps a successful save when refreshing the consolidated list fails", async () => {
      const { result, client, readConsolidated } = await renderConsolidatedSkills();
      vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON, SQL]);
      readConsolidated.mockRejectedValue(new Error("Refresh failed"));

      await act(async () => {
        expect(await result.current.skills.saveSkills([PYTHON, SQL])).toBe(true);
      });

      await waitFor(() => expect(client.getQueryState(consolidatedQueryKey)?.status).toBe("error"));
      expect(result.current.skills.selectedSkills).toEqual([PYTHON, SQL]);
      expect(result.current.skills.feedback?.type).toBe("success");
      expect(result.current.consolidated.data).toEqual([PYTHON]);
    });
  });
});
