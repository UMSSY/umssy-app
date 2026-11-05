import { describe, expect, it } from "vitest"
import { FILE_VALIDATION_MESSAGES } from "@/modules/profile"
import {
  getAppointmentDocumentTypeLabel,
  validateAppointmentDocument,
} from "./appointment-document.utils"

const MB = 1024 * 1024

const makeFile = (name: string, type: string, size: number) => {
  const file = new File(["x"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("validateAppointmentDocument", () => {
  it.each([
    ["Tesis.pdf", "application/pdf"],
    ["Diseño.png", "image/png"],
    ["Foto.jpg", "image/jpeg"],
  ])("acepta %s", (name, type) => {
    expect(validateAppointmentDocument(makeFile(name, type, MB))).toBeNull()
  })

  it("acepta exactamente 5 MB y rechaza un byte más", () => {
    expect(validateAppointmentDocument(makeFile("cv.pdf", "application/pdf", 5 * MB))).toBeNull()
    expect(validateAppointmentDocument(makeFile("cv.pdf", "application/pdf", 5 * MB + 1))).toBe(
      FILE_VALIDATION_MESSAGES.fileTooLarge,
    )
  })

  it("rechaza un tipo que no es PDF, PNG ni JPG", () => {
    expect(validateAppointmentDocument(makeFile("notas.docx", "application/msword", MB))).toBe(
      FILE_VALIDATION_MESSAGES.invalidCertificateType,
    )
  })

  it("rechaza un archivo vacío", () => {
    expect(validateAppointmentDocument(makeFile("cv.pdf", "application/pdf", 0))).toBe(
      FILE_VALIDATION_MESSAGES.emptyFile,
    )
  })

  it("usa la extensión cuando el navegador no informa el tipo", () => {
    expect(validateAppointmentDocument(makeFile("cv.PDF", "", MB))).toBeNull()
    expect(validateAppointmentDocument(makeFile("cv.exe", "", MB))).toBe(
      FILE_VALIDATION_MESSAGES.invalidCertificateType,
    )
  })
})

describe("getAppointmentDocumentTypeLabel", () => {
  it("etiqueta el tipo según el mime type", () => {
    expect(getAppointmentDocumentTypeLabel(makeFile("a.pdf", "application/pdf", 1))).toBe("PDF")
    expect(getAppointmentDocumentTypeLabel(makeFile("a.jpeg", "image/jpeg", 1))).toBe("JPG")
  })

  it("usa la extensión si el mime type no es conocido", () => {
    expect(getAppointmentDocumentTypeLabel(makeFile("plano.png", "", 1))).toBe("PNG")
  })
})
