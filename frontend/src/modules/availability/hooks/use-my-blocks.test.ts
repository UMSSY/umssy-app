import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useMyBlocks } from "./use-my-blocks"
import { availabilityApi } from "../services/availability.api"
import type { AvailabilityBlock } from "../types/availability-block.types"

const WEEK_OF_OCT_5 = "2026-10-05T04:00:00.000Z"
const WEEK_OF_OCT_12 = "2026-10-12T04:00:00.000Z"

const blockAt = (id: string, startAt: string): AvailabilityBlock => ({
  id,
  mentorId: "m1",
  startAt,
  endAt: startAt,
  state: "free",
  createdAt: "",
  updatedAt: "",
})

describe("useMyBlocks", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("pide los bloques de lunes a domingo de la semana indicada", async () => {
    const spy = vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([])

    const { result } = renderHook(() => useMyBlocks(WEEK_OF_OCT_5))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(spy).toHaveBeenCalledWith({
      from: "2026-10-05T04:00:00.000Z",
      to: "2026-10-12T03:59:59.999Z",
    })
  })

  it("descarta la respuesta de una semana anterior que llega tarde", async () => {
    let resolveOldWeek: (blocks: AvailabilityBlock[]) => void = () => {}
    vi.spyOn(availabilityApi, "getAvailabilityBlocks")
      .mockImplementationOnce(() => new Promise((resolve) => (resolveOldWeek = resolve)))
      .mockResolvedValueOnce([blockAt("new", "2026-10-13T14:00:00.000Z")])

    const { result, rerender } = renderHook(({ weekStart }) => useMyBlocks(weekStart), {
      initialProps: { weekStart: WEEK_OF_OCT_5 },
    })
    rerender({ weekStart: WEEK_OF_OCT_12 })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    resolveOldWeek([blockAt("old", "2026-10-06T14:00:00.000Z")])
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current.blocks.map((block) => block.id)).toEqual(["new"])
  })

  it("limpia los bloques y vuelve a cargar al cambiar de semana", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks")
      .mockResolvedValueOnce([blockAt("a", "2026-10-06T14:00:00.000Z")])
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result, rerender } = renderHook(({ weekStart }) => useMyBlocks(weekStart), {
      initialProps: { weekStart: WEEK_OF_OCT_5 },
    })
    await waitFor(() => expect(result.current.blocks).toHaveLength(1))

    rerender({ weekStart: WEEK_OF_OCT_12 })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blocks).toEqual([])
  })

  it("devuelve un mensaje de error si falla la consulta", async () => {
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useMyBlocks(WEEK_OF_OCT_5))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe("Error al obtener los bloques de disponibilidad")
  })

  it("refetch vuelve a pedir la misma semana sin vaciar los bloques", async () => {
    const spy = vi
      .spyOn(availabilityApi, "getAvailabilityBlocks")
      .mockResolvedValueOnce([blockAt("a", "2026-10-06T14:00:00.000Z")])
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result } = renderHook(() => useMyBlocks(WEEK_OF_OCT_5))
    await waitFor(() => expect(result.current.blocks).toHaveLength(1))

    act(() => result.current.refetch())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.blocks).toHaveLength(1)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenLastCalledWith({
      from: "2026-10-05T04:00:00.000Z",
      to: "2026-10-12T03:59:59.999Z",
    })
  })
})
