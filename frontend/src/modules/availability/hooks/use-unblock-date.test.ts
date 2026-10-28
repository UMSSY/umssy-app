import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useUnblockDate } from "./use-unblock-date"
import { availabilityApi } from "../services/availability.service"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useUnblockDate", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it("inicia sin mutación", () => {
    const { result } = renderHook(() => useUnblockDate(), createQueryWrapper())

    expect(result.current.isUnblocking).toBe(false)
  })

  it("actualiza la fecha, avisa con un toast e invalida las consultas de bloques", async () => {
    const mutationSpy = vi
      .spyOn(availabilityApi, "unblockDate")
      .mockResolvedValue(undefined)
    const queryWrapper = createQueryWrapper()
    const invalidateSpy = vi.spyOn(queryWrapper.client, "invalidateQueries")
    const { result } = renderHook(() => useUnblockDate(), queryWrapper)

    let succeeded: boolean | undefined
    await act(async () => {
      succeeded = await result.current.unblockDate("b1")
    })

    expect(succeeded).toBe(true)
    expect(mutationSpy).toHaveBeenCalledWith("b1")
    expect(toast.success).toHaveBeenCalledWith("Fecha desbloqueada correctamente")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["availability"] })
  })

  it("usa el mensaje genérico cuando la API falla sin detalle", async () => {
    vi.spyOn(availabilityApi, "unblockDate").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useUnblockDate(), createQueryWrapper())

    let succeeded: boolean | undefined
    await act(async () => {
      succeeded = await result.current.unblockDate("b1")
    })

    expect(succeeded).toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Error al desbloquear la fecha")
  })

  it("muestra el detalle del backend en un toast cuando responde con un error de negocio", async () => {
    vi.spyOn(availabilityApi, "unblockDate").mockRejectedValue({
      response: { data: { statusCode: 409, detail: "No puedes bloquear un día con citas confirmadas", ok: false } },
    })
    const { result } = renderHook(() => useUnblockDate(), createQueryWrapper())

    await act(async () => {
      await result.current.unblockDate("b1")
    })

    expect(toast.error).toHaveBeenCalledWith("No puedes bloquear un día con citas confirmadas")
  })

  it("marca isUnblocking mientras la petición está en curso", async () => {
    let resolveMutation!: () => void
    vi.spyOn(availabilityApi, "unblockDate").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve
        }),
    )
    const { result } = renderHook(() => useUnblockDate(), createQueryWrapper())

    let pending!: Promise<boolean>
    act(() => {
      pending = result.current.unblockDate("b1")
    })

    await waitFor(() => expect(result.current.isUnblocking).toBe(true))

    await act(async () => {
      resolveMutation()
      await pending
    })

    await waitFor(() => expect(result.current.isUnblocking).toBe(false))
  })
})
