import { DOCUMENT_ALLOWED_EXTENSIONS, DOCUMENT_ALLOWED_TYPES, MAX_FILE_UPLOAD_SIZE_BYTES } from "@/shared/constants/file-upload.constants";

export const INVALID_FORMAT_MESSAGE = "Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF.";
export const EMPTY_FILE_MESSAGE = "El archivo está vacío.";
export const FILE_TOO_LARGE_MESSAGE = "El archivo supera el máximo de 10 MB.";

function hasAllowedFormat(name: string, type: string): boolean {
  const mime = type.trim().toLowerCase();
  // Algunos navegadores no informan el MIME: solo entonces se usa la extensión
  if (mime.length > 0) return DOCUMENT_ALLOWED_TYPES.includes(mime);
  const lowerName = name.toLowerCase();
  return DOCUMENT_ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

// Devuelve el mensaje de error o null si el archivo es válido. El servidor repite la validación con la firma real
export function validateDocumentFile(file: { name: string; type: string; size: number }): string | null {
  if (!hasAllowedFormat(file.name, file.type)) return INVALID_FORMAT_MESSAGE;
  if (file.size === 0) return EMPTY_FILE_MESSAGE;
  if (file.size > MAX_FILE_UPLOAD_SIZE_BYTES) return FILE_TOO_LARGE_MESSAGE;
  return null;
}
