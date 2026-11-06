import { describe, it, expect, vi, beforeEach } from "vitest"
import { availabilityApi } from "./availability.service"
import { apiClient } from "@/shared/services/api-client"
import type { AvailabilityBlock } from "../types/availability-block.types"

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const envelope = <T>(data: T) => ({
  data: { statusCode: 200, ok: true, detail: "Operación exitosa", data },
})

const mockBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T10:00:00Z",
  endAt: "2024-01-15T11:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("availabilityApi", () => {
  it("consulta fechas futuras sin limitar el rango a una semana", async () => {
    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope([]));
    await expect(availabilityApi.getFutureBlockedDates("2026-10-31T00:00:00-04:00")).resolves.toEqual([]);
    const url = new URL(spy.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/blocked-dates");
    expect(url.searchParams.get("from")).toBe("2026-10-31T00:00:00-04:00");
    expect(url.searchParams.has("to")).toBe(false);
  });

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("getAvailabilityBlocks envía from y to en UTC", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope([mockBlock]))

    const result = await availabilityApi.getAvailabilityBlocks({
      from: "2024-01-15T00:00:00Z",
      to: "2024-01-16T00:00:00Z",
    })

    expect(getSpy).toHaveBeenCalledWith(
      "/availability-blocks?from=2024-01-15T00%3A00%3A00.000Z&to=2024-01-16T00%3A00%3A00.000Z"
    )
    expect(result).toEqual([mockBlock])
  })

  it("getAvailabilityBlocks llama a la API sin filtros", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope([mockBlock]))

    const result = await availabilityApi.getAvailabilityBlocks()

    expect(getSpy).toHaveBeenCalledWith("/availability-blocks")
    expect(result).toEqual([mockBlock])
  })

  it("getMentorFreeBlocks llama a la ruta de bloques libres del mentor", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope([mockBlock]))

    const result = await availabilityApi.getMentorFreeBlocks("m1", {
      startAt: "2026-10-05T04:00:00.000Z",
      endAt: "2026-10-12T03:59:59.999Z",
    })

    expect(getSpy).toHaveBeenCalledWith(
      "/mentors/m1/free-blocks?from=2026-10-05T04%3A00%3A00.000Z&to=2026-10-12T03%3A59%3A59.999Z",
    )
    expect(result).toEqual([mockBlock])
  })

  it("getAvailabilityBlockById llama a la API con ID correcto", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope(mockBlock))

    const result = await availabilityApi.getAvailabilityBlockById("1")

    expect(getSpy).toHaveBeenCalledWith("/availability-blocks/1")
    expect(result).toEqual(mockBlock)
  })

  it("createAvailabilityBlock envía solo startAt y endAt en ISO", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(envelope(mockBlock))

    await availabilityApi.createAvailabilityBlock({ startAt: "2024-01-15T10:00", endAt: "2024-01-15T11:00" })

    const [url, payload] = postSpy.mock.calls[0] as [string, Record<string, unknown>]
    expect(url).toBe("/availability-blocks")
    expect(Object.keys(payload).sort()).toEqual(["endAt", "startAt"])
    expect(payload.startAt).toMatch(ISO_UTC)
    expect(payload.endAt).toMatch(ISO_UTC)
  })

  it("createAvailabilityBlock incluye repeatWeekly y repeatUntil cuando se repite", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(envelope({ created: 3, skipped: [] }))

    await availabilityApi.createAvailabilityBlock({
      startAt: "2024-01-15T10:00",
      endAt: "2024-01-15T11:00",
      repeatWeekly: true,
      repeatUntil: "2024-02-05",
    })

    const [, payload] = postSpy.mock.calls[0] as [string, Record<string, unknown>]
    expect(Object.keys(payload).sort()).toEqual(["endAt", "repeatUntil", "repeatWeekly", "startAt"])
    expect(payload.repeatWeekly).toBe(true)
    expect(payload.repeatUntil).toBe("2024-02-05")
  })

  it("updateAvailabilityBlock llama a la API con ID y datos correctos", async () => {
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue(envelope(mockBlock))

    await availabilityApi.updateAvailabilityBlock("1", { startAt: "2024-01-15T12:00" })

    const [url, payload] = patchSpy.mock.calls[0] as [string, Record<string, unknown>]
    expect(url).toBe("/availability-blocks/1")
    expect(Object.keys(payload)).toEqual(["startAt"])
    expect(payload.startAt).toMatch(ISO_UTC)
  })

  it("updateAvailabilityBlock codifica el ID con caracteres especiales", async () => {
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue(envelope(mockBlock))

    await availabilityApi.updateAvailabilityBlock("a/b&c", { startAt: "2024-01-15T12:00" })

    expect(patchSpy).toHaveBeenCalledWith("/availability-blocks/a%2Fb%26c", expect.any(Object))
  })

  it("deleteAvailabilityBlock llama a la API con ID correcto", async () => {
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({})

    await availabilityApi.deleteAvailabilityBlock("1")

    expect(deleteSpy).toHaveBeenCalledWith("/availability-blocks/1")
  })

  it("deleteAvailabilityBlock codifica el ID con caracteres especiales", async () => {
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({})

    await availabilityApi.deleteAvailabilityBlock("a/b&c")

    expect(deleteSpy).toHaveBeenCalledWith("/availability-blocks/a%2Fb%26c")
  })

  it("getMyAvailabilityStatus lee el estado del mentor en sesión", async () => {
    const status = { mentorId: "m1", isAvailable: true }
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(envelope(status))

    await expect(availabilityApi.getMyAvailabilityStatus()).resolves.toEqual(status)
    expect(getSpy).toHaveBeenCalledWith("/mentors/me/availability")
  })

  it("updateAvailabilityStatus envía isAvailable al mentor codificado", async () => {
    const status = { mentorId: "a/b", isAvailable: false }
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue(envelope(status))

    await expect(availabilityApi.updateAvailabilityStatus("a/b", false)).resolves.toEqual(status)
    expect(patchSpy).toHaveBeenCalledWith("/mentors/a%2Fb/availability", { isAvailable: false })
  })
})


describe("blocked dates API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("consulta las fechas bloqueadas por rango", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(envelope([]))
    expect(await availabilityApi.getBlockedDates({
      startAt: "2026-10-26T04:00:00.000Z", endAt: "2026-11-02T03:59:59.999Z",
    })).toEqual([])
    expect(get).toHaveBeenCalledWith("/blocked-dates?from=2026-10-26T04%3A00%3A00.000Z&to=2026-11-02T03%3A59%3A59.999Z")
  })

  it.each([undefined, null, "", "Compromiso personal"])("conserva el día de Bolivia y admite motivo %s", async (reason) => {
    const date = { id: "d1", mentorId: "m1", blockedOn: "2026-10-26", reason: reason || null, createdAt: "" }
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(envelope(date))
    const input = reason === undefined ? { blockedOn: date.blockedOn } : { blockedOn: date.blockedOn, reason }
    expect(await availabilityApi.blockDate(input)).toEqual(date)
    expect(post).toHaveBeenCalledWith("/blocked-dates", input)
  })

  it("desbloquea por id y lo codifica", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue({})
    await availabilityApi.unblockDate("a/b&c")
    expect(remove).toHaveBeenCalledWith("/blocked-dates/a%2Fb%26c")
  })
})
