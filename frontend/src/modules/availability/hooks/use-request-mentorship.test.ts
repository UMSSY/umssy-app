import { describe, expect, it, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { useRequestMentorship } from "./use-request-mentorship"
import { availabilityApi } from "../services/availability.api"
import { REQUEST_MENTORSHIP_TEXT } from "../constants/request-mentorship.constants"
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
    const { result } = renderHook(() => useRequestMentorship("m1"))

    await act(() => result.current.requestMentorship())

    expect(getSpy).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith("/mentors/m1/availability")
    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.isChecking).toBe(false)
  })

  it("muestra un toast de error y no navega si no hay bloques en ninguna semana", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockResolvedValue([])
    const { result } = renderHook(() => useRequestMentorship("m1"))

    await act(() => result.current.requestMentorship())

    expect(toast.error).toHaveBeenCalledWith(REQUEST_MENTORSHIP_TEXT.noSlots)
    expect(push).not.toHaveBeenCalled()
  })

  it("muestra un toast de error si falla la verificación", async () => {
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockRejectedValue(new Error("network"))
    const { result } = renderHook(() => useRequestMentorship("m1"))

    await act(() => result.current.requestMentorship())

    expect(toast.error).toHaveBeenCalledWith(REQUEST_MENTORSHIP_TEXT.checkError)
    expect(push).not.toHaveBeenCalled()
    expect(result.current.isChecking).toBe(false)
  })

  it("ignora el resultado de una verificación vieja si llega después de una más nueva", async () => {
    const staleResolvers: Array<(blocks: AvailabilityBlock[]) => void> = []
    let callCount = 0
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockImplementation(() => {
      callCount += 1
      if (callCount <= 2) {
        return new Promise((resolve) => staleResolvers.push(resolve))
      }
      return Promise.resolve([freeBlock])
    })
    const { result } = renderHook(() => useRequestMentorship("m1"))

    let staleRequest!: Promise<void>
    act(() => {
      staleRequest = result.current.requestMentorship()
    })
    await act(async () => {
      await result.current.requestMentorship()
    })

    expect(push).toHaveBeenCalledTimes(1)

    await act(async () => {
      staleResolvers.forEach((resolve) => resolve([]))
      await staleRequest
    })

    expect(push).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.isChecking).toBe(false)
  })

  it("ignora el error de una verificación vieja si llega después de una más nueva", async () => {
    const staleRejecters: Array<(reason: unknown) => void> = []
    let callCount = 0
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockImplementation(() => {
      callCount += 1
      if (callCount <= 2) {
        return new Promise((_resolve, reject) => staleRejecters.push(reject))
      }
      return Promise.resolve([freeBlock])
    })
    const { result } = renderHook(() => useRequestMentorship("m1"))

    let staleRequest!: Promise<void>
    act(() => {
      staleRequest = result.current.requestMentorship()
    })
    await act(async () => {
      await result.current.requestMentorship()
    })

    expect(push).toHaveBeenCalledTimes(1)

    await act(async () => {
      staleRejecters.forEach((reject) => reject(new Error("network")))
      await staleRequest
    })

    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.isChecking).toBe(false)
  })

  it("expone isChecking como true mientras verifica", async () => {
    let resolveFreeBlocks: (blocks: AvailabilityBlock[]) => void = () => {}
    vi.spyOn(availabilityApi, "getMentorFreeBlocks").mockReturnValue(
      new Promise((resolve) => {
        resolveFreeBlocks = resolve
      }),
    )
    const { result } = renderHook(() => useRequestMentorship("m1"))

    let requestPromise!: Promise<void>
    act(() => {
      requestPromise = result.current.requestMentorship()
    })
    expect(result.current.isChecking).toBe(true)

    await act(async () => {
      resolveFreeBlocks([freeBlock])
      await requestPromise
    })
    expect(result.current.isChecking).toBe(false)
  })
})
