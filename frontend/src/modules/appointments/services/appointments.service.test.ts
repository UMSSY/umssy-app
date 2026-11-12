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

  it("pide las citas del usuario con el alcance elegido y devuelve las de la página", async () => {
    const appointments = [{ id: "a1" }]
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(envelope({ items: appointments, total: 1, page: 1, pageSize: 10 }))

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

describe("getById", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("pide el detalle de la cita", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(envelope({ id: "a1" }))

    const result = await appointmentsApi.getById("a1")

    expect(get).toHaveBeenCalledWith("/appointments/a1")
    expect(result).toEqual({ id: "a1" })
  })
})

describe("getCounterpartPhoto", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("descarga la foto de la otra persona como blob", async () => {
    const photo = new Blob(["png"], { type: "image/png" })
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: photo })

    await expect(appointmentsApi.getCounterpartPhoto("a1")).resolves.toBe(photo)
    expect(get).toHaveBeenCalledWith("/appointments/a1/counterpart-photo", { responseType: "blob" })
  })

  it("devuelve null si la otra persona no tiene foto", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue({ isAxiosError: true, response: { status: 404 } })

    await expect(appointmentsApi.getCounterpartPhoto("a1")).resolves.toBeNull()
  })

  it("propaga otros errores", async () => {
    const error = { isAxiosError: true, response: { status: 500 } }
    vi.spyOn(apiClient, "get").mockRejectedValue(error)

    await expect(appointmentsApi.getCounterpartPhoto("a1")).rejects.toBe(error)
  })
})

describe("downloadDocument", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("descarga el documento de la cita como blob", async () => {
    const file = new Blob(["%PDF"], { type: "application/pdf" })
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: file })

    await expect(appointmentsApi.downloadDocument("a1")).resolves.toBe(file)
    expect(get).toHaveBeenCalledWith("/appointments/a1/document", { responseType: "blob" })
  })
})
