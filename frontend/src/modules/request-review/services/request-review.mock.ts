import type {
  AccessRequestListPayload,
  AccessRequestListResponse,
  AccessRequestSummaryResponse,
  DocumentType,
  RequestStatus,
} from "../types/request-review.types";

const MOCK_DELAY_MS = 600;
const MOCK_REQUEST_COUNT = 47;
const MS_PER_HOUR = 3_600_000;

const MOCK_NAMES = [
  "Ana Rojas Mamani",
  "Luis Fernández Cruz",
  "María Quispe Villca",
  "Carlos Mendoza Rivera",
  "Valeria Choque Flores",
  "Jorge Salazar Peña",
  "Lucía Vargas Soliz",
];

const STATUS_CYCLE: RequestStatus[] = ["PENDING", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];

// Ordenadas de la más reciente a la más antigua, como devolverá el backend
const MOCK_REQUESTS: AccessRequestSummaryResponse[] = Array.from(
  { length: MOCK_REQUEST_COUNT },
  (_, index) => {
    const documentType: DocumentType = index % 3 === 0 ? "NATIONAL_TITLE" : "ACADEMIC_DIPLOMA";
    return {
      id: `mock-${index + 1}`,
      code: `SOL-2026-${String(index + 1).padStart(4, "0")}`,
      fullName: MOCK_NAMES[index % MOCK_NAMES.length],
      email: `solicitante${index + 1}@example.com`,
      sisCode: String(202000000 + index * 137),
      documentType,
      submittedAt: new Date(Date.now() - index * 3 * MS_PER_HOUR).toISOString(),
      status: STATUS_CYCLE[index % STATUS_CYCLE.length],
    };
  },
);

export async function listMockRequests({
  status,
  page,
  limit,
}: AccessRequestListPayload): Promise<AccessRequestListResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const filtered = MOCK_REQUESTS.filter((request) => request.status === status);
  const start = (page - 1) * limit;

  return { items: filtered.slice(start, start + limit), total: filtered.length, page };
}