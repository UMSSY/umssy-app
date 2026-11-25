
import { apiClient } from "@/shared/services/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMentorDirectory } from "./mentor-directory.service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getMentorDirectory", () => {
  it("envía los UUID de la selección múltiple en una sola consulta", async () => {
    const areaIds = [
      "06d773ee-90d1-40c0-9744-c7c3601b84ef",
      "ee0d0fe2-bc99-4a6a-8939-2bd663c3cae1",
    ];
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: { items: [] } } });
    await getMentorDirectory({ page: 2, search: "Senior", area: "", areaIds, available: true, sort: "default" });
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/mentors/directory", expect.objectContaining({
      params: expect.objectContaining({ area: undefined, areaIds: areaIds.join(","), search: "Senior", available: "true", page: 2 }),
    }));
  });
  it.each([
    "http://localhost:8081/api",
    "https://dev.umssy.test/api/",
    "https://umssy.test/api",
  ])(
    "resuelve fotos con %s sin solicitudes por tarjeta",
    async (baseURL) => {
      const photoUrl = "/mentors/mentor-1/photo?v=2026-10-09";

      const directory = {
        items: [
          {
            id: "mentor-1",
            fullName: "Ana",
            headline: null,
            technicalAreas: [],
            photoUrl,
            education: {
              degree: "Ingeniería",
              institution: "UMSS",
            },
            isAvailable: true,
            orientationTypes: ["Orientación técnica"],
          },
          {
            id: "mentor-2",
            fullName: "Luis",
            headline: null,
            technicalAreas: [],
            photoUrl: null,
            education: null,
            isAvailable: false,
            orientationTypes: [],
          },
        ],
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
        effectiveSort: "default",
        affinityStatus: "ready",
      };

      const get = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: {
          statusCode: 200,
          ok: true,
          detail: "Operación exitosa",
          data: directory,
        },
      });

      const previousBaseURL = apiClient.defaults.baseURL;
      apiClient.defaults.baseURL = baseURL;

      try {
        const result = await getMentorDirectory({
          page: 1,
          search: "",
          area: "",
          available: false,
          sort: "default",
        });

        const normalizedBaseURL = baseURL.replace(/\/$/, "");

        expect(result.items[0]?.photoUrl).toBe(
          `${normalizedBaseURL}${photoUrl}`,
        );

        expect(result.items[0]?.orientationTypes).toEqual([
          "Orientación técnica",
        ]);

        expect(result.items[0]?.education).toEqual({
          degree: "Ingeniería",
          institution: "UMSS",
        });

        expect(result.items[1]?.photoUrl).toBeNull();
        expect(result.items[1]?.orientationTypes).toEqual([]);
        expect(get).toHaveBeenCalledTimes(1);
      } finally {
        apiClient.defaults.baseURL = previousBaseURL;
      }
    },
  );

  it("returns the active mentor directory from the real API endpoint", async () => {
    const mentors = [
      {
        id: "0424f370-00f0-43cf-9b8a-997af81840b9",
        fullName: "María Fernanda Rodríguez",
        headline: "Desarrolladora Backend Senior",
        technicalAreas: ["Backend", "APIs"],
        photoUrl: null,
        education: null,
        isAvailable: false,
        orientationTypes: [],
      },
      {
        id: "0fa5e6de-63a4-430e-87fb-22f5eb700ecd",
        fullName: "Carlos Andrés Vargas",
        headline: null,
        technicalAreas: [],
        photoUrl: null,
        education: null,
        isAvailable: false,
        orientationTypes: [],
      },
    ];

    const directory = {
      items: mentors,
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
      effectiveSort: "default" as const,
      affinityStatus: "ready" as const,
    };

    const signal = new AbortController().signal;

    const request = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Operación exitosa",
        data: directory,
      },
    });

    const params = {
      page: 1,
      search: "",
      area: "",
      available: false,
      sort: "default" as const,
    };

    const result = await getMentorDirectory(params, signal);

    expect(request).toHaveBeenCalledWith("/mentors/directory", {
      params: {
        page: 1,
        search: undefined,
        area: undefined,
        available: "false",
        sort: "default",
      },
      signal,
    });

    expect(result).toEqual({
      ...directory,
      items: mentors,
    });
  });

  it("envía affinity a la API cuando se solicita afinidad", async () => {
    const directory = {
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
      effectiveSort: "default" as const,
      affinityStatus: "no_skills" as const,
    };

    const request = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Operación exitosa",
        data: directory,
      },
    });

    await getMentorDirectory({
      page: 1,
      search: "",
      area: "",
      available: false,
      sort: "affinity",
    });

    expect(request).toHaveBeenCalledExactlyOnceWith(
      "/mentors/directory",
      expect.objectContaining({
        params: {
          page: 1,
          search: undefined,
          area: undefined,
          available: "false",
          sort: "affinity",
        },
      }),
    );
  });
});
