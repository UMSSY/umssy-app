import { describe, expect, it, vi, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper"
import { useRequestMentorship } from "./use-request-mentorship"
import { availabilityApi } from "../services/availability.service"
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants"
import { REQUEST_MENTORSHIP_TEXT } from "../constants/request-mentorship.constants"
import { getWeekRange } from "@/shared/utils/date-time"
import type { AvailabilityBlock } from "../types/availability-block.types"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

const freeBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2026-10-06T22:00:00.000Z",
  endAt: "2026-10-06T23:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("useRequestMentorship", () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it("navega a la disponibilidad del mentor si hay bloques libres", async () => {
    const getSpy = vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([freeBlock])
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    await act(() => result.current.requestMentorship())

    expect(getSpy).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith("/mentors/m1/availability")
    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.hasNoSlots).toBe(false)
    expect(result.current.isChecking).toBe(false)
  })

  it("expone hasNoSlots y no navega si no hay bloques en ninguna semana", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([])
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    await act(() => result.current.requestMentorship())

    expect(result.current.hasNoSlots).toBe(true)
    expect(push).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("muestra un toast de error si falla la verificación", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockRejectedValue(new Error("network"))
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    await act(() => result.current.requestMentorship())

    expect(toast.error).toHaveBeenCalledWith(REQUEST_MENTORSHIP_TEXT.checkError)
    expect(push).not.toHaveBeenCalled()
    expect(result.current.hasNoSlots).toBe(false)
    expect(result.current.isChecking).toBe(false)
  })

  it("guarda la semana actual en la misma query key que useMentorFreeBlocks", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([freeBlock])
    const queryWrapper = createQueryWrapper()
    const { result } = renderHook(() => useRequestMentorship("m1"), queryWrapper)

    await act(() => result.current.requestMentorship())

    const currentWeekStart = getWeekRange(new Date()).startAt
    const cached = queryWrapper.client.getQueryData(
      AVAILABILITY_QUERY_KEYS.freeBlocks("m1", currentWeekStart),
    )
    expect(cached).toEqual([freeBlock])
  })

  it("no repite la llamada de red si se hace click dos veces mientras verifica (dedupe + lastRequestRef)", async () => {
    let resolveFreeBlocks: (blocks: AvailabilityBlock[]) => void = () => {}
    const getSpy = vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockReturnValue(
      new Promise((resolve) => {
        resolveFreeBlocks = resolve
      }),
    )
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    let firstRequest!: Promise<void>
    act(() => {
      firstRequest = result.current.requestMentorship()
    })
    let secondRequest!: Promise<void>
    act(() => {
      secondRequest = result.current.requestMentorship()
    })

    await act(async () => {
      resolveFreeBlocks([freeBlock])
      await Promise.all([firstRequest, secondRequest])
    })

    expect(getSpy).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledTimes(1)
    expect(result.current.isChecking).toBe(false)
  })

  it("si la verificación falla con dos clicks seguidos, solo muestra un toast", async () => {
    let rejectFreeBlocks: (reason: unknown) => void = () => {}
    const getSpy = vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFreeBlocks = reject
      }),
    )
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    let firstRequest!: Promise<void>
    act(() => {
      firstRequest = result.current.requestMentorship()
    })
    let secondRequest!: Promise<void>
    act(() => {
      secondRequest = result.current.requestMentorship()
    })

    await act(async () => {
      rejectFreeBlocks(new Error("network"))
      await Promise.all([firstRequest, secondRequest])
    })

    expect(getSpy).toHaveBeenCalledTimes(2)
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(result.current.isChecking).toBe(false)
  })

  it("expone isChecking como true mientras verifica", async () => {
    let resolveFreeBlocks: (blocks: AvailabilityBlock[]) => void = () => {}
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockReturnValue(
      new Promise((resolve) => {
        resolveFreeBlocks = resolve
      }),
    )
    const { result } = renderHook(() => useRequestMentorship("m1"), createQueryWrapper())

    let requestPromise!: Promise<void>
    act(() => {
      requestPromise = result.current.requestMentorship()
    })
    await waitFor(() => expect(result.current.isChecking).toBe(true))

    await act(async () => {
      resolveFreeBlocks([freeBlock])
      await requestPromise
    })
    expect(result.current.isChecking).toBe(false)
  })
})
