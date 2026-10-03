import { StrictMode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useMentorFreeBlocks } from "./use-mentor-free-blocks"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability"

const mockBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T10:00:00Z",
  endAt: "2024-01-15T11:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("useMentorFreeBlocks", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("obtiene los bloques libres del mentor", async () => {
    const spy = vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([mockBlock])

    const { result } = renderHook(() => useMentorFreeBlocks("m1"), { wrapper: StrictMode })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(spy).toHaveBeenCalledWith("m1")
    expect(result.current.blocks).toEqual([mockBlock])
    expect(result.current.error).toBeNull()
  })

  it("maneja error al obtener bloques libres", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useMentorFreeBlocks("m1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Error al obtener los bloques de disponibilidad")
  })

  it("vuelve a pedir datos cuando cambia el mentor", async () => {
    const spy = vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([])

    const { result, rerender } = renderHook(({ mentorId }) => useMentorFreeBlocks(mentorId), {
      initialProps: { mentorId: "m1" },
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    rerender({ mentorId: "m2" })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(spy).toHaveBeenLastCalledWith("m2")
  })
})
