import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useDeleteBlock } from "./use-delete-block"
import { availabilityApi } from "../services/availability.api"

describe("useDeleteBlock", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("inicia sin eliminación ni error", () => {
    const { result } = renderHook(() => useDeleteBlock())

    expect(result.current.isDeleting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("elimina el bloque correctamente", async () => {
    const deleteSpy = vi
      .spyOn(availabilityApi, "deleteAvailabilityBlock")
      .mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteBlock())

    let removed: boolean | undefined
    await act(async () => {
      removed = await result.current.deleteBlock("b1")
    })

    expect(removed).toBe(true)
    expect(deleteSpy).toHaveBeenCalledWith("b1")
    expect(result.current.isDeleting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("expone error cuando la API falla", async () => {
    vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useDeleteBlock())

    let removed: boolean | undefined
    await act(async () => {
      removed = await result.current.deleteBlock("b1")
    })

    expect(removed).toBe(false)
    expect(result.current.error).toBe("Error al eliminar el bloque de disponibilidad")
    expect(result.current.isDeleting).toBe(false)
  })

  it("muestra el detalle del backend cuando responde con un error de negocio", async () => {
    vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockRejectedValue({
      response: { data: { statusCode: 409, detail: "El bloque tiene una cita asociada", ok: false } },
    })
    const { result } = renderHook(() => useDeleteBlock())

    let removed: boolean | undefined
    await act(async () => {
      removed = await result.current.deleteBlock("b1")
    })

    expect(removed).toBe(false)
    expect(result.current.error).toBe("El bloque tiene una cita asociada")
    expect(result.current.isDeleting).toBe(false)
  })

  it("marca isDeleting mientras la petición está en curso", async () => {
    let resolveDelete!: () => void
    vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve
        })
    )
    const { result } = renderHook(() => useDeleteBlock())

    let pending!: Promise<boolean>
    act(() => {
      pending = result.current.deleteBlock("b1")
    })

    expect(result.current.isDeleting).toBe(true)

    await act(async () => {
      resolveDelete()
      await pending
    })

    await waitFor(() => expect(result.current.isDeleting).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it("limpia el error con clearError", async () => {
    vi.spyOn(availabilityApi, "deleteAvailabilityBlock").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useDeleteBlock())

    await act(async () => {
      await result.current.deleteBlock("b1")
    })
    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
