import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useBlockDate } from "./use-block-date"
import type { BlockedDate } from "../types/blocked-date.types"
import { availabilityApi } from "../services/availability.service"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useBlockDate", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it("inicia sin mutación", () => {
    const { result } = renderHook(() => useBlockDate(), createQueryWrapper())

    expect(result.current.isBlocking).toBe(false)
  })

  it("actualiza la fecha, avisa con un toast e invalida las consultas de bloques", async () => {
    const mutationSpy = vi
      .spyOn(availabilityApi, "blockDate")
      .mockResolvedValue({ id: "d1", mentorId: "m1", blockedOn: "2026-10-26", reason: null, createdAt: "" })
    const queryWrapper = createQueryWrapper()
    const invalidateSpy = vi.spyOn(queryWrapper.client, "invalidateQueries")
    const { result } = renderHook(() => useBlockDate(), queryWrapper)

    let succeeded: boolean | undefined
    await act(async () => {
      succeeded = await result.current.blockDate({ blockedOn: "2026-10-26" })
    })

    expect(succeeded).toBe(true)
    expect(mutationSpy).toHaveBeenCalledWith({ blockedOn: "2026-10-26" })
    expect(toast.success).toHaveBeenCalledWith("Fecha bloqueada correctamente")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["availability"] })
  })

  it("usa el mensaje genérico cuando la API falla sin detalle", async () => {
    vi.spyOn(availabilityApi, "blockDate").mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useBlockDate(), createQueryWrapper())

    let succeeded: boolean | undefined
    await act(async () => {
      succeeded = await result.current.blockDate({ blockedOn: "2026-10-26" })
    })

    expect(succeeded).toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Error al bloquear la fecha")
  })

  it.each([[409, "No puedes bloquear un día con citas confirmadas"], [400, "No se pueden bloquear fechas pasadas"]])("muestra el detail del error %s", async (statusCode, detail) => {
    vi.spyOn(availabilityApi, "blockDate").mockRejectedValue({
      response: { data: { statusCode, detail, ok: false } },
    })
    const { result } = renderHook(() => useBlockDate(), createQueryWrapper())

    await act(async () => {
      await result.current.blockDate({ blockedOn: "2026-10-26" })
    })

    expect(toast.error).toHaveBeenCalledWith(detail)
  })

  it("marca isBlocking mientras la petición está en curso", async () => {
    let resolveMutation!: () => void
    vi.spyOn(availabilityApi, "blockDate").mockImplementation(
      () =>
        new Promise<BlockedDate>((resolve) => {
          resolveMutation = () => resolve({ id: "d1", mentorId: "m1", blockedOn: "2026-10-26", reason: null, createdAt: "" })
        }),
    )
    const { result } = renderHook(() => useBlockDate(), createQueryWrapper())

    let pending!: Promise<boolean>
    act(() => {
      pending = result.current.blockDate({ blockedOn: "2026-10-26" })
    })

    await waitFor(() => expect(result.current.isBlocking).toBe(true))

    await act(async () => {
      resolveMutation()
      await pending
    })

    await waitFor(() => expect(result.current.isBlocking).toBe(false))
  })
})
