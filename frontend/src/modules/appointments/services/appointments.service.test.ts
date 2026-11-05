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
    const input = { blockId: "b1", orientationTypeId: "t1", message: "Quiero revisar mi CV" }
    const appointment = { id: "a1" }
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(envelope(appointment))

    const result = await appointmentsApi.createAppointment(input)

    expect(post).toHaveBeenCalledWith("/appointments", input)
    expect(result).toEqual(appointment)
  })
})

describe("uploadDocument", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("sube el archivo como multipart en el campo file de la cita", async () => {
    const file = new File(["%PDF-1.4"], "Tesis.pdf", { type: "application/pdf" })
    const document = {
      fileName: "Tesis.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
      uploadedAt: "2026-10-22T15:00:00.000Z",
    }
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(envelope(document))

    const result = await appointmentsApi.uploadDocument("a1", file)

    const [url, body] = post.mock.calls[0]
    expect(url).toBe("/appointments/a1/document")
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get("file")).toBe(file)
    expect(result).toEqual(document)
  })
})
