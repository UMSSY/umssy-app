import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWeekGridDensity } from "./use-week-grid-density";
import { WEEK_GRID_DENSITY_STORAGE_KEY } from "../constants/week-grid.constants";

describe("useWeekGridDensity", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("empieza en normal cuando no hay preferencia guardada", () => {
    const { result } = renderHook(() => useWeekGridDensity());
    expect(result.current.density).toBe("normal");
  });

  it("lee la preferencia guardada en localStorage al montar", () => {
    window.localStorage.setItem(WEEK_GRID_DENSITY_STORAGE_KEY, "compact");
    const { result } = renderHook(() => useWeekGridDensity());
    expect(result.current.density).toBe("compact");
  });

  it("ignora un valor guardado inválido y se queda en normal", () => {
    window.localStorage.setItem(WEEK_GRID_DENSITY_STORAGE_KEY, "cozy");
    const { result } = renderHook(() => useWeekGridDensity());
    expect(result.current.density).toBe("normal");
  });

  it("guarda la preferencia al cambiarla y se mantiene al volver a montar", () => {
    const { result } = renderHook(() => useWeekGridDensity());

    act(() => result.current.setDensity("compact"));

    expect(result.current.density).toBe("compact");
    expect(window.localStorage.getItem(WEEK_GRID_DENSITY_STORAGE_KEY)).toBe("compact");

    const { result: remounted } = renderHook(() => useWeekGridDensity());
    expect(remounted.current.density).toBe("compact");
  });
});
