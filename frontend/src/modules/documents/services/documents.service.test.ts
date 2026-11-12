import "@/shared/testing/indexed-db.mock";
import { saveAccessToken, clearAccessToken } from "@/shared/services/storage/access-token-storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";

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
  beforeEach(async () => {
    await saveAccessToken("token-123");
  });

  afterEach(() => {
    clearAccessToken();
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
    clearAccessToken();
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
    expect(config).toEqual({ headers: AUTH_HEADERS, onUploadProgress: expect.any(Function) });
  });

  it("reports the upload progress as a percentage", async () => {
    const onProgress = vi.fn();
    vi.mocked(apiClient.post).mockImplementation((_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 256, total: 1024, bytes: 256, lengthComputable: true });
      config?.onUploadProgress?.({ loaded: 256, total: undefined, bytes: 0, lengthComputable: false });
      return Promise.resolve(wrapResponse(CV_RESPONSE));
    });

    await documentsService.uploadCv(new File(["%PDF"], "resume.pdf", { type: "application/pdf" }), onProgress);

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(25);
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

  it("requests the cv generated from the profile as a blob", async () => {
    const pdf = new Blob(["%PDF"], { type: "application/pdf" });
    vi.mocked(apiClient.post).mockResolvedValue({ data: pdf });

    await expect(documentsService.generateCv()).resolves.toBe(pdf);
    expect(apiClient.post).toHaveBeenCalledWith(
      "/profile/cv/generate",
      {},
      {
        headers: AUTH_HEADERS,
        responseType: "blob",
      },
    );
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

  it("requests the extraction of a cv and fills the missing data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      wrapResponse({
        cvId: "cv-1",
        contact: { email: "ana@mail.com", cityId: "city-lpz" },
        presentation: "Desarrolladora web",
        educations: null,
        skills: [{ skillId: "skill-ts", name: "TypeScript" }],
      }),
    );

    await expect(documentsService.extractCvData("cv-1")).resolves.toEqual({
      cvId: "cv-1",
      contact: { firstName: null, lastName: null, email: "ana@mail.com", phone: null, location: null, cityId: "city-lpz" },
      presentation: { headline: null, aboutMe: "Desarrolladora web" },
      educations: [],
      workExperiences: [],
      skills: [{ skillId: "skill-ts", name: "TypeScript" }],
    });
    expect(apiClient.post).toHaveBeenCalledWith("/profile/me/cvs/cv-1/extraction", {}, { headers: AUTH_HEADERS });
  });

  it("propagates the extraction error to the caller", async () => {
    const error = { response: { status: 422, data: { code: "CV_UNREADABLE" } } };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    await expect(documentsService.extractCvData("cv-1")).rejects.toBe(error);
  });
});
