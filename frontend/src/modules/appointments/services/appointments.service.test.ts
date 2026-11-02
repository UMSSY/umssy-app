import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/shared/services/api-client"
import { appointmentsApi } from "./appointments.service"

const envelope = <T>(data: T) => ({
  data: { statusCode: 200, ok: true, detail: "Operación exitosa", data },
})

describe("getMyAppointments", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("pide las citas del usuario con el alcance elegido", async () => {
    const appointments = [{ id: "a1" }]
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(envelope(appointments))

    const result = await appointmentsApi.getMyAppointments("past")

    expect(get).toHaveBeenCalledWith("/appointments/me", { params: { scope: "past" } })
    expect(result).toEqual(appointments)
  })
})

describe("createAppointment", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("envía el bloque, el tema y el mensaje a /appointments", async () => {
    const input = { blockId: "b1", orientationTypeId: "t1", message: null }
    const appointment = { id: "a1" }
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(envelope(appointment))

    const result = await appointmentsApi.createAppointment(input)

    expect(post).toHaveBeenCalledWith("/appointments", input)
    expect(result).toEqual(appointment)
  })
})
