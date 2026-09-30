import { describe, expect, it } from "vitest";
import {
  hasErrors,
  validatePersonalInfo,
  validatePhotoFile,
  validatePresentation,
} from "./profile-validation";

const VALID_PERSONAL_INFO = {
  firstName: "Valeria",
  lastName: "Quispe",
  cityId: "city-cbba",
  phone: "+591 700 00000",
  personalEmail: "nombre@correo.com",
};

const VALID_PRESENTATION = {
  headline: "Desarrolladora web junior",
  aboutMe: "Soy egresada de Ingeniería de Sistemas de la UMSS.",
  interestedOpportunities: "",
};

describe("validatePersonalInfo", () => {
  it("accepts valid data", () => {
    expect(validatePersonalInfo(VALID_PERSONAL_INFO)).toEqual({});
  });

  it("requires every field", () => {
    const errors = validatePersonalInfo({
      firstName: "",
      lastName: " ",
      cityId: "",
      phone: "",
      personalEmail: "",
    });

    expect(errors).toEqual({
      firstName: "El nombre es obligatorio.",
      lastName: "El apellido es obligatorio.",
      cityId: "Selecciona tu ciudad de residencia.",
      phone: "El teléfono es obligatorio.",
      personalEmail: "El correo personal es obligatorio.",
    });
  });

  it("validates name length and characters", () => {
    expect(validatePersonalInfo({ ...VALID_PERSONAL_INFO, firstName: "V" }).firstName).toBe(
      "El nombre debe tener al menos 2 caracteres.",
    );
    expect(
      validatePersonalInfo({ ...VALID_PERSONAL_INFO, firstName: "a".repeat(101) }).firstName,
    ).toBe("El nombre no puede superar los 100 caracteres.");
    expect(validatePersonalInfo({ ...VALID_PERSONAL_INFO, lastName: "Quispe2" }).lastName).toBe(
      "El apellido solo puede contener letras y espacios.",
    );
  });

  it("validates the phone format", () => {
    expect(validatePersonalInfo({ ...VALID_PERSONAL_INFO, phone: "70a00000" }).phone).toBe(
      "El teléfono solo puede contener números, espacios, guiones y +.",
    );
    expect(validatePersonalInfo({ ...VALID_PERSONAL_INFO, phone: "12345" }).phone).toBe(
      "El teléfono debe tener entre 7 y 15 dígitos.",
    );
  });

  it("validates the email format and length", () => {
    expect(
      validatePersonalInfo({ ...VALID_PERSONAL_INFO, personalEmail: "correo-invalido" })
        .personalEmail,
    ).toBe("Ingresa un correo electrónico válido.");
    expect(
      validatePersonalInfo({
        ...VALID_PERSONAL_INFO,
        personalEmail: `${"a".repeat(150)}@correo.com`,
      }).personalEmail,
    ).toBe("El correo no puede superar los 150 caracteres.");
  });
});

describe("validatePresentation", () => {
  it("accepts valid data", () => {
    expect(validatePresentation(VALID_PRESENTATION)).toEqual({});
  });

  it("requires headline and about me", () => {
    expect(
      validatePresentation({ headline: "", aboutMe: "", interestedOpportunities: "" }),
    ).toEqual({
      headline: "El titular profesional es obligatorio.",
      aboutMe: 'El campo "Acerca de" es obligatorio.',
    });
  });

  it("limits the opportunities length", () => {
    const errors = validatePresentation({
      ...VALID_PRESENTATION,
      interestedOpportunities: "a".repeat(1001),
    });

    expect(errors.interestedOpportunities).toBe(
      "Las oportunidades de interés no pueden superar los 1000 caracteres.",
    );
  });
});

describe("validatePhotoFile", () => {
  it("accepts a small image", () => {
    const file = new File(["img"], "foto.png", { type: "image/png" });

    expect(validatePhotoFile(file)).toBeUndefined();
  });

  it("rejects other file types", () => {
    const file = new File(["pdf"], "cv.pdf", { type: "application/pdf" });

    expect(validatePhotoFile(file)).toBe("La fotografía debe ser una imagen JPG, PNG o WEBP.");
  });

  it("rejects images larger than 2 MB", () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "foto.jpg", {
      type: "image/jpeg",
    });

    expect(validatePhotoFile(file)).toBe("La fotografía no puede superar los 2 MB.");
  });
});

describe("hasErrors", () => {
  it("tells whether there is at least one error", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ phone: "Error" })).toBe(true);
  });
});
