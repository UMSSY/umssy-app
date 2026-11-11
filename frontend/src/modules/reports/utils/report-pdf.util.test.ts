import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportPdf, parseReportCsv } from "./report-pdf.util";

describe("parseReportCsv", () => {
  it("preserva comas, comillas escapadas y saltos de línea en celdas CSV", () => {
    const rows = parseReportCsv('\uFEFFUsuario,Correo,Detalle\r\n"Pérez, Ana",ana@example.com,"Dijo ""sí""\ny fue aprobado"\r\n');

    expect(rows).toEqual([
      ["Usuario", "Correo", "Detalle"],
      ["Pérez, Ana", "ana@example.com", 'Dijo "sí"\ny fue aprobado'],
    ]);
  });
});

function mockReportLogos() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#08365C"/></svg>';
  const png = new Resvg(svg).render().asPng();
  const pngBlob = new Blob([new Uint8Array(png)], { type: "image/png" });
  const browserUrl = globalThis.URL;
  const urlStub = class extends browserUrl {};
  Object.assign(urlStub, {
    createObjectURL: vi.fn(() => "blob:report-logo"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("URL", urlStub);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => svg }));
  vi.stubGlobal("Image", class {
    naturalWidth = 10;
    naturalHeight = 10;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      this.onload?.();
    }
  });
  const context = {
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(pngBlob));
  return context;
}

describe("createReportPdf", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("genera un PDF con los logotipos locales y conserva el nombre del reporte", async () => {
    mockReportLogos();

    const result = await createReportPdf(
      new Blob(["\uFEFFUsuario,Correo\r\nAna Pérez,ana@example.com\r\n"], { type: "text/csv" }),
      "usuarios-registrados.csv",
      "Usuarios aceptados",
    );

    expect(result.file.type).toBe("application/pdf");
    expect(result.fileName).toBe("usuarios-registrados.pdf");
    expect(await result.file.text()).toContain("%PDF-");
  });

  it("continúa el reporte en páginas adicionales cuando hay muchas filas", async () => {
    mockReportLogos();
    const rows = Array.from({ length: 60 }, (_, index) =>
      `Usuario ${index + 1},usuario${index + 1}@example.com,Estudiante,${index + 1},Diploma,01/10/2026`,
    );
    const csv = ["Usuario,Correo,Tipo de Usuario,Identificador,Documento,Fecha de Registro", ...rows].join("\r\n");

    const result = await createReportPdf(new Blob([csv]), "usuarios.csv", "Usuarios aceptados");
    const pdf = await PDFDocument.load(await result.file.arrayBuffer());

    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });

  it("representa nombres Unicode que no admite la fuente estándar", async () => {
    const context = mockReportLogos();
    const result = await createReportPdf(
      new Blob(["Usuario,Correo\r\n李,li@example.com\r\n"]),
      "usuarios.csv",
      "Usuarios aceptados",
    );

    expect(context.fillText).toHaveBeenCalledWith("李", expect.any(Number), 0);
    expect(await result.file.text()).toContain("%PDF-");
  });

  it("informa un error si no se pueden cargar los logotipos institucionales", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(createReportPdf(new Blob(["Usuario\r\nAna"]), "usuarios.csv", "Usuarios aceptados"))
      .rejects.toThrow("No se pudo cargar el logotipo institucional.");
  });
});