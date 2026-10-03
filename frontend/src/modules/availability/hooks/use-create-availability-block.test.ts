import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCreateAvailabilityBlock } from "./use-create-availability-block"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability"

const input = { startAt: "2024-01-15T10:00", endAt: "2024-01-15T11:00" }

const mockBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T14:00:00Z",
  endAt: "2024-01-15T15:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("useCreateAvailabilityBlock", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("no pide la lista de bloques al montar", () => {
    const spy = vi.spyOn(availabilityApi, "getAvailabilityBlocks")

    const { result } = renderHook(() => useCreateAvailabilityBlock())

    expect(spy).not.toHaveBeenCalled()
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("crea un bloque y devuelve el resultado", async () => {
    const createSpy = vi.spyOn(availabilityApi, "createAvailabilityBlock").mockResolvedValue(mockBlock)

    const { result } = renderHook(() => useCreateAvailabilityBlock())

    const created = await act(async () => result.current.createBlock(input))

    expect(createSpy).toHaveBeenCalledWith(input)
    expect(created).toEqual(mockBlock)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("expone el error y lo limpia en el siguiente intento", async () => {
    vi.spyOn(availabilityApi, "createAvailabilityBlock")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockBlock)

    const { result } = renderHook(() => useCreateAvailabilityBlock())

    const failed = await act(async () => result.current.createBlock(input))

    expect(failed).toBeNull()
    expect(result.current.error).toBe("Error al crear el bloque de disponibilidad")

    await act(async () => result.current.createBlock(input))

    expect(result.current.error).toBeNull()
  })
})
