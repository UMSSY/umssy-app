import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/modules/profile/config/auth-storage.config";
import { documentsService } from "./documents.service";

vi.mock("@/shared/services/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/api-client")>()),
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const AUTH_HEADERS = { Authorization: "Bearer token-123" };

const CV_RESPONSE = {
  id: "cv-1",
  fileName: "CV-Test-User.pdf",
  fileType: "application/pdf",
  sizeInBytes: 1258291,
  updatedAt: "2026-10-03T12:00:00.000Z",
  isCurrent: true,
};

const SAVED_CV = {
  id: "cv-1",
  fileName: "CV-Test-User.pdf",
  fileType: "PDF",
  sizeInBytes: 1258291,
  updatedAt: new Date("2026-10-03T12:00:00.000Z"),
  isCurrent: true,
};

function wrapResponse<T>(data: T) {
  return { data: { statusCode: 200, data, detail: "OK", ok: true } };
}

describe("documentsService", () => {
  beforeEach(() => {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "token-123");
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("gets a page of cvs of the current user with the access token", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      wrapResponse({ items: [CV_RESPONSE], totalItems: 7, totalPages: 2, page: 1, limit: 5 }),
    );

    await expect(documentsService.getCvs(1, 5)).resolves.toEqual({
      items: [SAVED_CV],
      totalItems: 7,
      totalPages: 2,
      page: 1,
    });
    expect(apiClient.get).toHaveBeenCalledWith("/profile/me/cvs", {
      headers: AUTH_HEADERS,
      params: { page: 1, limit: 5 },
    });
  });

  it("returns an empty page when the response has no data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(wrapResponse(null));

    await expect(documentsService.getCvs(1, 5)).resolves.toEqual({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
    });
  });

  it("sends no authorization header when there is no saved token", async () => {
    window.sessionStorage.clear();
    vi.mocked(apiClient.get).mockResolvedValue(wrapResponse(null));

    await documentsService.getCvs(2, 10);

    expect(apiClient.get).toHaveBeenCalledWith("/profile/me/cvs", {
      headers: {},
      params: { page: 2, limit: 10 },
    });
  });

  it("posts a new cv as multipart form data in the file field", async () => {
    const file = new File([new Uint8Array(1024)], "resume.pdf", { type: "application/pdf" });
    vi.mocked(apiClient.post).mockResolvedValue(wrapResponse(CV_RESPONSE));

    await expect(documentsService.uploadCv(file)).resolves.toEqual(SAVED_CV);

    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe("/profile/me/cvs");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);
    expect(config).toEqual({ headers: AUTH_HEADERS });
  });

  it("returns null when the upload response has no cv", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(wrapResponse(null));

    await expect(
      documentsService.uploadCv(new File(["%PDF"], "resume.pdf", { type: "application/pdf" })),
    ).resolves.toBeNull();
  });

  it("gets the pdf of the chosen cv as a blob", async () => {
    const pdf = new Blob(["%PDF"], { type: "application/pdf" });
    vi.mocked(apiClient.get).mockResolvedValue({ data: pdf });

    await expect(documentsService.getCvFile("cv-1")).resolves.toBe(pdf);
    expect(apiClient.get).toHaveBeenCalledWith("/profile/me/cvs/cv-1/file", {
      headers: AUTH_HEADERS,
      responseType: "blob",
    });
  });

  it("deletes the chosen cv by its id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(wrapResponse(null));

    await expect(documentsService.deleteCv("cv-1")).resolves.toBeUndefined();
    expect(apiClient.delete).toHaveBeenCalledWith("/profile/me/cvs/cv-1", {
      headers: AUTH_HEADERS,
    });
  });

  it("propagates the http error to the caller", async () => {
    const error = { response: { status: 415 } };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    await expect(
      documentsService.uploadCv(new File(["x"], "photo.pdf", { type: "application/pdf" })),
    ).rejects.toBe(error);
  });
});
