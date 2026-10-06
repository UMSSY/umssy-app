import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useUpdateAvailabilityBlock } from "./use-update-availability-block"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability-block.types"

const mockBlock: AvailabilityBlock = {
  id: "b1",
  mentorId: "m1",
  startAt: "2030-05-13T14:00:00Z",
  endAt: "2030-05-13T16:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("useUpdateAvailabilityBlock", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("inicia sin envío ni error", () => {
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("actualiza el bloque correctamente", async () => {
    const updateSpy = vi
      .spyOn(availabilityApi, "updateAvailabilityBlock")
      .mockResolvedValue(mockBlock)
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    let updated: AvailabilityBlock | null = null
    await act(async () => {
      updated = await result.current.updateBlock("b1", { startAt: mockBlock.startAt })
    })

    expect(updated).toEqual(mockBlock)
    expect(updateSpy).toHaveBeenCalledWith("b1", { startAt: mockBlock.startAt })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("muestra el detalle del backend cuando responde con un error de negocio (409)", async () => {
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockRejectedValue({
      response: { data: { statusCode: 409, detail: "Los bloques de disponibilidad se solapan", ok: false } },
    })
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    await act(async () => {
      const updated = await result.current.updateBlock("b1", {})
      expect(updated).toBeNull()
    })

    expect(result.current.error).toBe("Los bloques de disponibilidad se solapan")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("muestra el detalle del backend para un error de validación (400)", async () => {
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockRejectedValue({
      response: { data: { statusCode: 400, detail: "La hora de inicio debe ser anterior a la hora de fin", ok: false } },
    })
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    await act(async () => {
      await result.current.updateBlock("b1", {})
    })

    expect(result.current.error).toBe("La hora de inicio debe ser anterior a la hora de fin")
  })

  it("expone error genérico cuando la API falla sin detalle", async () => {
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    let updated: AvailabilityBlock | null = mockBlock
    await act(async () => {
      updated = await result.current.updateBlock("b1", {})
    })

    expect(updated).toBeNull()
    expect(result.current.error).toBe("Error al actualizar el bloque de disponibilidad")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("marca isSubmitting mientras la petición está en curso", async () => {
    let resolveUpdate!: (block: AvailabilityBlock) => void
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockImplementation(
      () =>
        new Promise<AvailabilityBlock>((resolve) => {
          resolveUpdate = resolve
        })
    )
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    let pending!: Promise<AvailabilityBlock | null>
    act(() => {
      pending = result.current.updateBlock("b1", {})
    })

    expect(result.current.isSubmitting).toBe(true)

    await act(async () => {
      resolveUpdate(mockBlock)
      await pending
    })

    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it("limpia el error con clearError", async () => {
    vi.spyOn(availabilityApi, "updateAvailabilityBlock").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useUpdateAvailabilityBlock())

    await act(async () => {
      await result.current.updateBlock("b1", {})
    })
    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
