import { CERTIFICATE_ALLOWED_EXTENSIONS } from "@/modules/profile";

export const APPOINTMENT_DOCUMENT_ACCEPT = CERTIFICATE_ALLOWED_EXTENSIONS.join(",");

export const APPOINTMENT_DOCUMENT_TEXT = {
  label: "Documento (opcional)",
  hint: "PDF, PNG o JPG de hasta 5 MB: tu CV, tu tesis, un diseño u otro trabajo.",
  select: "Adjuntar documento",
  change: "Cambiar",
  remove: "Quitar",
  removeLabel: "Quitar el documento adjunto",
  uploadError:
    "La cita quedó confirmada, pero no se pudo adjuntar el documento. Vuelve a intentarlo más tarde.",
} as const;
