import { describe, expect, it } from "vitest"
import { isWeeklyRepeatResponse } from "./is-weekly-repeat-response"
import type { AvailabilityBlock } from "../types/availability-block.types"

const block: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T10:00:00Z",
  endAt: "2024-01-15T11:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("isWeeklyRepeatResponse", () => {
  it("reconoce la respuesta de una serie semanal", () => {
    expect(isWeeklyRepeatResponse({ created: 3, skipped: [] })).toBe(true)
  })

  it("reconoce un bloque único como no-serie", () => {
    expect(isWeeklyRepeatResponse(block)).toBe(false)
  })
})
