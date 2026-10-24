import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useBlockedDates } from "./use-blocked-dates"
import { availabilityApi } from "../services/availability.api"
import type { BlockedDate } from "../types/blocked-date.types"

const WEEK_OF_OCT_5 = "2026-10-05T04:00:00.000Z"
const WEEK_OF_OCT_12 = "2026-10-12T04:00:00.000Z"

const blockAt = (id: string, startAt: string): BlockedDate => ({
  id,
  mentorId: "m1",
  blockedOn: startAt.slice(0, 10),
  reason: null,
  createdAt: "",
})

describe("useBlockedDates", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("pide los bloques de lunes a domingo de la semana indicada", async () => {
    const spy = vi.spyOn(availabilityApi, "getBlockedDates").mockResolvedValue([])

    const { result } = renderHook(() => useBlockedDates(WEEK_OF_OCT_5), createQueryWrapper())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(spy).toHaveBeenCalledWith({
      startAt: "2026-10-05T04:00:00.000Z",
      endAt: "2026-10-12T03:59:59.999Z",
    })
  })

  it("devuelve los bloques de la semana pedida", async () => {
    vi.spyOn(availabilityApi, "getBlockedDates").mockResolvedValue([
      blockAt("a", "2026-10-06T14:00:00.000Z"),
    ])

    const { result } = renderHook(() => useBlockedDates(WEEK_OF_OCT_5), createQueryWrapper())

    await waitFor(() => expect(result.current.blockedDates).toHaveLength(1))
    expect(result.current.error).toBeNull()
  })

  it("al cambiar de semana muestra la carga sin los bloques de la semana anterior", async () => {
    vi.spyOn(availabilityApi, "getBlockedDates")
      .mockResolvedValueOnce([blockAt("a", "2026-10-06T14:00:00.000Z")])
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result, rerender } = renderHook(({ weekStart }) => useBlockedDates(weekStart), {
      ...createQueryWrapper(),
      initialProps: { weekStart: WEEK_OF_OCT_5 },
    })
    await waitFor(() => expect(result.current.blockedDates).toHaveLength(1))

    rerender({ weekStart: WEEK_OF_OCT_12 })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blockedDates).toEqual([])
  })

  it("devuelve un mensaje de error si falla la consulta", async () => {
    vi.spyOn(availabilityApi, "getBlockedDates").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useBlockedDates(WEEK_OF_OCT_5), createQueryWrapper())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe("Error al obtener las fechas bloqueadas")
  })
})
