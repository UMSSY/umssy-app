import { describe, expect, it } from "vitest";
import { DOCKER, KUBERNETES, VALID_CONDITIONS } from "../testing/vacancy-fixtures";
import { toJobOfferPayload } from "./to-job-offer-payload";

describe("toJobOfferPayload", () => {
  it("traduce el estado del wizard al contrato del backend", () => {
    expect(toJobOfferPayload(VALID_CONDITIONS)).toEqual({
      title: "DevOps Senior",
      description: "Buscamos un perfil DevOps con experiencia en Docker y Kubernetes.",
      modality: "Híbrido",
      contractType: "Tiempo completo",
      category: "Tecnología",
      positionsAvailable: 2,
      salaryMin: 6500,
      salaryMax: 8000,
      languages: "Español, inglés intermedio",
      locationUrl: "https://maps.app.goo.gl/TechBolivia",
      skillIds: [DOCKER.id, KUBERNETES.id],
    });
  });

  it("no envía salaryMax cuando el salario es un monto fijo", () => {
    const payload = toJobOfferPayload({ ...VALID_CONDITIONS, salary: "Bs 5.000" });

    expect(payload.salaryMin).toBe(5000);
    expect(payload).not.toHaveProperty("salaryMax");
  });

  it("no envía salario en una pasantía", () => {
    const payload = toJobOfferPayload({ ...VALID_CONDITIONS, contractType: "Pasantía", salary: "" });

    expect(payload).not.toHaveProperty("salaryMin");
    expect(payload).not.toHaveProperty("salaryMax");
  });

  it("recorta los espacios de los textos", () => {
    const payload = toJobOfferPayload({ ...VALID_CONDITIONS, title: "  DevOps  ", languages: " Español " });

    expect(payload.title).toBe("DevOps");
    expect(payload.languages).toBe("Español");
  });

  it("envía la fecha de cierre a las 23:59 de Bolivia en formato ISO UTC", () => {
    const payload = toJobOfferPayload(VALID_CONDITIONS, new Date(2026, 11, 15));

    expect(payload.expiresAt).toBe("2026-12-16T03:59:00.000Z");
  });

  it("no envía expiresAt cuando la vacante no tiene fecha de cierre", () => {
    expect(toJobOfferPayload(VALID_CONDITIONS)).not.toHaveProperty("expiresAt");
    expect(toJobOfferPayload(VALID_CONDITIONS, null)).not.toHaveProperty("expiresAt");
  });
});
