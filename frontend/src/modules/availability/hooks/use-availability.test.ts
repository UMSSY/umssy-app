import { StrictMode } from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useAvailability } from "./use-availability"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock, AvailabilityFilters } from "../types/availability"

const block = (id: string, startAt: string, endAt: string): AvailabilityBlock => ({
  id,
  mentorId: "m1",
  startAt,
  endAt,
  state: "free",
  createdAt: "",
  updatedAt: "",
})

describe("useAvailability", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("inicializa con estado de carga", () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockImplementation(
      () => new Promise(() => {})
    )

    const { result } = renderHook(() => useAvailability())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blocks).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.mutationError).toBeNull()
  })

  it("obtiene bloques de disponibilidad correctamente", async () => {
    const mockBlocks = [block("1", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z")]
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue(mockBlocks)

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.blocks).toEqual(mockBlocks)
    expect(result.current.error).toBeNull()
  })

  it("no queda cargando en StrictMode", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    const { result } = renderHook(() => useAvailability(), { wrapper: StrictMode })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("vuelve a pedir datos cuando cambian los filtros", async () => {
    const spy = vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ filters }: { filters: AvailabilityFilters }) => useAvailability(filters),
      { initialProps: { filters: { from: "2024-01-15T00:00:00Z" } } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    rerender({ filters: { from: "2024-01-16T00:00:00Z" } })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => {
      expect(spy).toHaveBeenLastCalledWith({ from: "2024-01-16T00:00:00Z", to: undefined })
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it("no vuelve a pedir datos si los filtros tienen los mismos valores", async () => {
    const spy = vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ filters }: { filters: AvailabilityFilters }) => useAvailability(filters),
      { initialProps: { filters: { from: "2024-01-15T00:00:00Z" } } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    rerender({ filters: { from: "2024-01-15T00:00:00Z" } })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("maneja error al obtener bloques", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Error al obtener los bloques de disponibilidad")
    expect(result.current.blocks).toEqual([])
  })

  it("refetch reinicia isLoading y error", async () => {
    const mockBlocks = [block("1", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z")]
    vi.spyOn(availabilityApi, "getAvailabilityBlocks")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockBlocks)

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.error).toBe("Error al obtener los bloques de disponibilidad")
    })

    act(() => {
      result.current.refetch()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.blocks).toEqual(mockBlocks)
  })

  it("actualiza un bloque de disponibilidad", async () => {
    const mockBlocks = [block("1", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z")]
    const updatedBlock = block("1", "2024-01-15T12:00:00Z", "2024-01-15T13:00:00Z")
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue(mockBlocks)
    const updateSpy = vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockResolvedValue(updatedBlock)

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updated = await act(async () => {
      return result.current.updateBlock("1", { startAt: "2024-01-15T12:00:00Z" })
    })

    expect(updateSpy).toHaveBeenCalledWith("1", { startAt: "2024-01-15T12:00:00Z" })
    expect(updated).toEqual(updatedBlock)
    expect(result.current.blocks[0].startAt).toBe("2024-01-15T12:00:00Z")
  })

  it("maneja error al actualizar bloque", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updated = await act(async () => {
      return result.current.updateBlock("1", { startAt: "2024-01-15T12:00:00Z" })
    })

    expect(updated).toBeNull()
    expect(result.current.mutationError).toBe("Error al actualizar el bloque de disponibilidad")
  })

  it("elimina un bloque de disponibilidad", async () => {
    const mockBlocks = [
      block("1", "2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z"),
      block("2", "2024-01-15T14:00:00Z", "2024-01-15T15:00:00Z"),
    ]
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue(mockBlocks)
    const deleteSpy = vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockResolvedValue(undefined)

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const deleted = await act(async () => {
      return result.current.deleteBlock("1")
    })

    expect(deleteSpy).toHaveBeenCalledWith("1")
    expect(deleted).toBe(true)
    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].id).toBe("2")
  })

  it("maneja error al eliminar bloque", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])
    vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useAvailability())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const deleted = await act(async () => {
      return result.current.deleteBlock("1")
    })

    expect(deleted).toBe(false)
    expect(result.current.mutationError).toBe("Error al eliminar el bloque de disponibilidad")
  })
})
