import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useExpirationDate } from "./use-expiration-date";

const DATE = new Date(2026, 11, 15);

afterEach(() => {
  cleanup();
});

describe("useExpirationDate", () => {
  it("empieza sin fecha de cierre y es válido para publicar", () => {
    const { result } = renderHook(() => useExpirationDate());
    expect(result.current.status).toBe("disabled");
    expect(result.current.hasExpiration).toBe(false);
    expect(result.current.isExpirationValid).toBe(true);
  });

  it("al marcar el checkbox muestra el calendario y no permite publicar", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    expect(result.current.status).toBe("selecting");
    expect(result.current.isExpirationValid).toBe(false);
  });

  it("al elegir un día pide confirmación", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    expect(result.current.status).toBe("confirming");
    expect(result.current.selectedDate).toEqual(DATE);
    expect(result.current.confirmedDate).toBeNull();
  });

  it("'Sí' confirma la fecha y permite publicar", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    act(() => result.current.confirmDate());
    expect(result.current.status).toBe("confirmed");
    expect(result.current.confirmedDate).toEqual(DATE);
    expect(result.current.isExpirationValid).toBe(true);
  });

  it("'No' limpia la fecha y vuelve al calendario", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    act(() => result.current.rejectDate());
    expect(result.current.status).toBe("selecting");
    expect(result.current.selectedDate).toBeNull();
  });

  it("'Cambiar fecha' vuelve al calendario con la fecha anterior marcada", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    act(() => result.current.confirmDate());
    act(() => result.current.changeDate());
    expect(result.current.status).toBe("selecting");
    expect(result.current.selectedDate).toEqual(DATE);
    expect(result.current.isExpirationValid).toBe(false);
  });

  it("desmarcar el checkbox borra la fecha", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    act(() => result.current.confirmDate());
    act(() => result.current.toggleExpiration(false));
    expect(result.current.status).toBe("disabled");
    expect(result.current.selectedDate).toBeNull();
  });

  it("ignora el undefined que manda el calendario al volver a hacer clic en el mismo día", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(undefined));
    expect(result.current.status).toBe("selecting");
  });

  it("resetExpiration vuelve al estado inicial", () => {
    const { result } = renderHook(() => useExpirationDate());
    act(() => result.current.toggleExpiration(true));
    act(() => result.current.selectDate(DATE));
    act(() => result.current.confirmDate());
    act(() => result.current.resetExpiration());
    expect(result.current.status).toBe("disabled");
    expect(result.current.confirmedDate).toBeNull();
  });
});