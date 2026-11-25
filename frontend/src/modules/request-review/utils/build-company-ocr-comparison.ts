import type {
  CompanyAccessRequestItem,
  CompanyOcrFieldDetail,
} from "@/modules/access-requests";
import type { CompanyOcrComparisonEntry } from "../types/company-ocr-comparison-entry.types";

function getFieldComparison(
  item: CompanyAccessRequestItem,
  fieldKey: keyof NonNullable<CompanyAccessRequestItem["ocrFieldResults"]>,
  fallbackDeclared: string,
): CompanyOcrFieldDetail {
  const ocr = item.ocrFieldResults;
  const detail = ocr?.[fieldKey] as CompanyOcrFieldDetail | undefined;
  if (detail && typeof detail === "object" && "declared" in detail) {
    return detail;
  }
  if (fieldKey === "companyName") {
    const isMatched = Boolean(ocr?.companyNameMatched);
    return {
      declared: fallbackDeclared,
      detectedText: isMatched ? fallbackDeclared : null,
      matched: isMatched,
    };
  }
  if (fieldKey === "requestIntent") {
    const isMatched = Boolean(ocr?.requestIntentMatched);
    return {
      declared: "Carta formal de solicitud de acceso a UMSSY",
      detectedText: isMatched
        ? "Petición formal de acceso a la carrera/plataforma UMSS"
        : null,
      matched: isMatched,
    };
  }
  return {
    declared: fallbackDeclared,
    detectedText: null,
    matched: false,
  };
}

export function buildCompanyOcrComparison(
  item: CompanyAccessRequestItem,
  cityName: string,
): CompanyOcrComparisonEntry[] {
  return [
    {
      id: "companyName",
      label: "Razón Social / Nombre de la Empresa",
      data: getFieldComparison(item, "companyName", item.companyName),
    },
    {
      id: "city",
      label: "Ciudad Sede",
      data: getFieldComparison(item, "city", cityName),
    },
    {
      id: "email",
      label: "Correo Electrónico Institucional",
      data: getFieldComparison(item, "email", item.email),
    },
    {
      id: "phone",
      label: "Teléfono de Contacto",
      data: getFieldComparison(item, "phone", item.phone),
    },
    {
      id: "websiteUrl",
      label: "Sitio Web Corporativo",
      data: getFieldComparison(
        item,
        "websiteUrl",
        item.websiteUrl || "No especificado (Opcional)",
      ),
    },
    {
      id: "sector",
      label: "Rubro / Sector Económico",
      data: getFieldComparison(item, "sector", item.sector),
    },
    {
      id: "requestIntent",
      label: "Intención Formal de Solicitud de Acceso",
      data: getFieldComparison(
        item,
        "requestIntent",
        "Solicitud formal de cuenta institucional para reclutador en UMSSY",
      ),
    },
  ];
}
