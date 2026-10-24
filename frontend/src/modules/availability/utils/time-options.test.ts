import { describe, expect, it } from "vitest"
import { getPastTimeLimit, isEndTimeDisabled, isStartTimeDisabled } from "./time-options"

const NOW = new Date("2026-10-08T14:10:00Z")
const NO_LIMITS = { pastLimit: null, startTime: "", endTime: "" }

describe("time-options", () => {
  it("devuelve la hora actual de Bolivia solo si la fecha es hoy", () => {
    expect(getPastTimeLimit("2026-10-08", NOW)).toBe("10:10")
    expect(getPastTimeLimit("2026-10-09", NOW)).toBeNull()
    expect(getPastTimeLimit("", NOW)).toBeNull()
  })

  it("deshabilita como inicio las horas pasadas, las que no son anteriores al fin y las 22:00", () => {
    expect(isStartTimeDisabled("10:00", { ...NO_LIMITS, pastLimit: "10:10" })).toBe(true)
    expect(isStartTimeDisabled("10:30", { ...NO_LIMITS, pastLimit: "10:10" })).toBe(false)
    expect(isStartTimeDisabled("12:00", { ...NO_LIMITS, endTime: "12:00" })).toBe(true)
    expect(isStartTimeDisabled("11:30", { ...NO_LIMITS, endTime: "12:00" })).toBe(false)
    expect(isStartTimeDisabled("22:00", NO_LIMITS)).toBe(true)
  })

  it("deshabilita como fin las horas pasadas, las que no son posteriores al inicio y las 07:00", () => {
    expect(isEndTimeDisabled("10:00", { ...NO_LIMITS, pastLimit: "10:10" })).toBe(true)
    expect(isEndTimeDisabled("10:30", { ...NO_LIMITS, pastLimit: "10:10" })).toBe(false)
    expect(isEndTimeDisabled("09:00", { ...NO_LIMITS, startTime: "09:00" })).toBe(true)
    expect(isEndTimeDisabled("09:30", { ...NO_LIMITS, startTime: "09:00" })).toBe(false)
    expect(isEndTimeDisabled("07:00", NO_LIMITS)).toBe(true)
  })
})
