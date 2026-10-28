import { describe, expect, it } from "vitest"
import { formatAppointmentSchedule, validateAppointmentRequest } from "./appointment-request.utils"
import { REQUEST_APPOINTMENT_TEXT } from "../constants/request-appointment.constants"
import type { AvailabilityBlock } from "../types/availability-block.types"

const block: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2026-10-13T13:00:00.000Z",
  endAt: "2026-10-13T14:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("validateAppointmentRequest", () => {
  it("acepta un tema elegido y un mensaje vacío", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "" })).toEqual({})
  })

  it("exige el tema de la sesión", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "", message: "" })).toEqual({
      orientationTypeId: REQUEST_APPOINTMENT_TEXT.missingTopic,
    })
  })

  it("acepta 300 caracteres y rechaza 301", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "a".repeat(300) })).toEqual({})
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "a".repeat(301) })).toEqual({
      message: REQUEST_APPOINTMENT_TEXT.messageTooLong,
    })
  })
})

describe("formatAppointmentSchedule", () => {
  it("muestra fecha y horas en hora de Bolivia", () => {
    expect(formatAppointmentSchedule(block)).toBe(
      "Martes 13 de octubre de 2026, 09:00 - 10:00 · Hora de Bolivia (GMT-4)"
    )
  })
})
