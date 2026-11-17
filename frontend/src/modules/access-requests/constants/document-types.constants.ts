// Espeja el catálogo access_request_document_types del backend (títulos del catálogo)
// TODO: pedir el catálogo al backend si se agrega un endpoint de tipos de documento
export const DOCUMENT_TYPES = ["academic_diploma", "national_title"] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{ value: DocumentType; label: string }> = [
  { value: "academic_diploma", label: "Diploma académico" },
  { value: "national_title", label: "Título en provisión nacional" },
];
