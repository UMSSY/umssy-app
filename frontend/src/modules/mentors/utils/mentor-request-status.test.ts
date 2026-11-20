
import { describe, expect, it } from "vitest";
import {
  getMentorRequestStatusLabel,
  mentorRequestStatusLabels,
} from "./mentor-request-status";

describe("mentor request status HU14", () => {
  it.each([
    ["PENDING", "Pendiente"],
    ["OFFERED", "Cupo ofrecido"],
    ["ACTIVE", "Activa"],
    ["ENDED", "Finalizada"],
    ["CANCELLED", "Cancelada"],
    ["EXPIRED", "Vencida"],
  ])("traduce el estado %s como %s", (status, expected) => {
    expect(getMentorRequestStatusLabel(status)).toBe(expected);
  });

  it("conserva el código original cuando el estado es desconocido", () => {
    expect(getMentorRequestStatusLabel("UNKNOWN_STATUS")).toBe(
      "UNKNOWN_STATUS",
    );
  });

  it("mantiene exactamente los seis estados registrados", () => {
    expect(Object.keys(mentorRequestStatusLabels).sort()).toEqual([
      "ACTIVE",
      "CANCELLED",
      "ENDED",
      "EXPIRED",
      "OFFERED",
      "PENDING",
    ]);
  });
});
