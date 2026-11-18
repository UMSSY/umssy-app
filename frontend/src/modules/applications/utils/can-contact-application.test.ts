import { describe, expect, it } from "vitest";
import type { ApplicationStatus } from "../types/application.types";
import { canContactApplication } from "./can-contact-application";

describe("canContactApplication", () => {
  it.each<ApplicationStatus>(["En revisión", "Entrevista", "Aceptada"])(
    "allows contact when the status is %s",
    (status) => {
      expect(canContactApplication(status)).toBe(true);
    },
  );

  it.each<ApplicationStatus>(["No seleccionado", "Retirada"])(
    "does not allow contact when the status is %s",
    (status) => {
      expect(canContactApplication(status)).toBe(false);
    },
  );
});
