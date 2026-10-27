import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentViewer } from "../components/detail/document-viewer";
import { DataContrastPanel } from "../components/detail/data-contrast-panel";
import { HistoryCard } from "../components/detail/history-card";
import { generateOcrAnalysis, NOT_IN_DOCUMENT_TEXT, DIPLOMA_NOTE_TEXT } from "../utils/ocr-analysis";
import type { ReviewDetail } from "../types/request-review.types";

const mockDetail: ReviewDetail = {
  id: "req-1",
  requestCode: "SOL-2026-0148",
  status: "in_review",
  firstName: "Juan Carlos",
  lastName: "Pérez Rojas",
  idCardNumber: "7845123",
  idCardIssuedIn: "CB",
  sisCode: "201904512",
  email: "jc.perez@gmail.com",
  phone: "71234567",
  birthDate: "2000-01-15",
  graduationYear: 2024,
  career: "Ingeniería de Sistemas",
  document: {
    type: "academic_diploma",
    name: "diploma_juan_perez",
    extension: "pdf",
    mimeType: "application/pdf",
    size: 2048,
  },
  history: {
    submittedAt: "2026-09-22T09:14:00.000Z",
    openedAt: "2026-09-22T11:02:00.000Z",
    openedBy: "Carla Montaño",
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  },
};

describe("Epic OCR: Criterios de Aceptación (CA1 a CA15)", () => {
  afterEach(() => cleanup());

  it("CA1: Muestra marcas doradas sobre el documento para los datos reconocidos", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(
      <DocumentViewer
        url="blob:pdf"
        mimeType="application/pdf"
        fileName="diploma_juan_perez.pdf"
        ocrMarks={analysis.fields}
        recipientName="Juan Carlos Pérez Rojas"
        careerTitle="Ingeniería de Sistemas"
        graduationYear={2024}
      />,
    );

    const nameMark = screen.getByTestId("ocr-mark-name");
    const careerMark = screen.getByTestId("ocr-mark-career");

    expect(nameMark).toBeInTheDocument();
    expect(careerMark).toBeInTheDocument();
    // Borde discontinuo dorado
    expect(nameMark.className).toContain("border-[#D97706]");
    expect(careerMark.className).toContain("border-[#D97706]");
  });

  it("CA2 y CA3: Cada marca muestra etiqueta con el nombre del dato y su porcentaje de confianza", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(
      <DocumentViewer
        url="blob:pdf"
        mimeType="application/pdf"
        fileName="diploma_juan_perez.pdf"
        ocrMarks={analysis.fields}
        recipientName="Juan Carlos Pérez Rojas"
        careerTitle="Ingeniería de Sistemas"
        graduationYear={2024}
      />,
    );

    const nameLabel = screen.getByTestId("ocr-label-name");
    const careerLabel = screen.getByTestId("ocr-label-career");

    expect(nameLabel).toHaveTextContent("Nombre · 99%");
    expect(careerLabel).toHaveTextContent("Carrera · 98%");
  });

  it("CA4: Marca en rojo para datos dudosos o con baja confianza", () => {
    const analysis = generateOcrAnalysis(mockDetail, {
      doubtfulFields: ["name"],
      customConfidence: { name: 65 },
    });

    render(
      <DocumentViewer
        url="blob:pdf"
        mimeType="application/pdf"
        fileName="diploma_juan_perez.pdf"
        ocrMarks={analysis.fields}
      />,
    );

    const nameMark = screen.getByTestId("ocr-mark-name");
    const nameLabel = screen.getByTestId("ocr-label-name");

    expect(nameMark.className).toContain("border-red-500");
    expect(nameLabel.className).toContain("bg-red-600");
    expect(nameLabel).toHaveTextContent("Nombre · 65%");
  });

  it("CA5: No muestra marcas sobre el documento para datos no reconocidos", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(
      <DocumentViewer
        url="blob:pdf"
        mimeType="application/pdf"
        fileName="diploma_juan_perez.pdf"
        ocrMarks={analysis.fields}
      />,
    );

    // Carnet y Código SIS no tienen marca en el visor
    expect(screen.queryByTestId("ocr-mark-idCard")).toBeNull();
    expect(screen.queryByTestId("ocr-mark-sisCode")).toBeNull();
  });

  it("CA6: Muestra el valor leído por el OCR en la columna 'En el documento'", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(<DataContrastPanel detail={mockDetail} ocrAnalysis={analysis} />);

    expect(screen.getByText("JUAN CARLOS PÉREZ ROJAS")).toBeInTheDocument();
    expect(screen.getAllByText("Ingeniería de Sistemas")).toHaveLength(2); // Declarado y leído
    expect(screen.getByText("2024 (12 dic.)")).toBeInTheDocument();
  });

  it("CA7: Marca como coincidente o por verificar según corresponda", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(<DataContrastPanel detail={mockDetail} ocrAnalysis={analysis} />);

    expect(screen.getAllByTitle("Coincide")).toHaveLength(3);
    expect(screen.getAllByTitle("Por verificar")).toHaveLength(2);
  });

  it("CA8: Muestra los contadores de coincidencia del contraste", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(<DataContrastPanel detail={mockDetail} ocrAnalysis={analysis} />);

    expect(screen.getByText("3 coinciden")).toBeInTheDocument();
    expect(screen.getByText("2 por verificar")).toBeInTheDocument();
  });

  it("CA9: Muestra 'No figura en el documento' para carnet/código SIS con nota aclaratoria", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(<DataContrastPanel detail={mockDetail} ocrAnalysis={analysis} />);

    expect(screen.getAllByText(NOT_IN_DOCUMENT_TEXT)).toHaveLength(2);
    expect(screen.getByText(DIPLOMA_NOTE_TEXT)).toBeInTheDocument();
  });

  it("CA10 y CA11: Muestra advertencia y pide revisión manual si la lectura no es clara", () => {
    const analysis = generateOcrAnalysis(mockDetail, { isUnclear: true });
    render(<DataContrastPanel detail={mockDetail} ocrAnalysis={analysis} />);

    expect(screen.getByTestId("ocr-unclear-warning")).toBeInTheDocument();
    expect(screen.getByText(/Advertencia: Lectura automática poco clara/)).toBeInTheDocument();
    expect(screen.getByText(/Se requiere revisar el contraste de datos manualmente/)).toBeInTheDocument();
  });

  it("CA12: Indica el motivo de la revisión manual en el análisis", () => {
    const analysisDoubtfulName = generateOcrAnalysis(mockDetail, {
      doubtfulFields: ["name", "name_mismatch"],
      isUnclear: true,
    });
    expect(analysisDoubtfulName.manualReviewReason).toBe("El apellido no coincide");

    const analysisLegibility = generateOcrAnalysis(mockDetail, {
      doubtfulFields: ["career"],
      isUnclear: true,
    });
    expect(analysisLegibility.manualReviewReason).toBe("Documento poco legible");
  });

  it("CA13: Muestra el nombre del archivo y controles de acercar, rotar, ajustar y descargar", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(
      <DocumentViewer
        url="blob:pdf"
        mimeType="application/pdf"
        fileName="diploma_juan_perez.pdf"
        ocrMarks={analysis.fields}
      />,
    );

    expect(screen.getByText("diploma_juan_perez.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acercar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alejar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rotar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustar a pantalla" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descargar" })).toHaveAttribute("download", "diploma_juan_perez.pdf");
  });

  it("CA14: Registra el evento de 'Lectura OCR del documento' con responsable Sistema en el historial", () => {
    const analysis = generateOcrAnalysis(mockDetail);
    render(<HistoryCard detail={mockDetail} ocrReadAt={analysis.readAt} />);

    expect(screen.getByText("Historial de esta solicitud")).toBeInTheDocument();
    expect(screen.getByText(/Lectura OCR del documento \(Sistema\)/)).toBeInTheDocument();
  });

  it("Archivo cualquiera: No recaba datos si el archivo no es un diploma y los campos aparecen en vacío", () => {
    const arbitraryDetail: ReviewDetail = {
      ...mockDetail,
      document: {
        type: "academic_diploma",
        name: "documento-ficticio-37",
        extension: "pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    };

    const analysis = generateOcrAnalysis(arbitraryDetail);

    // No debe recabar datos del documento
    expect(analysis.matchingCount).toBe(0);
    expect(analysis.pendingCount).toBe(5);
    expect(analysis.isClear).toBe(false);

    // Los campos no reconocidos no tienen valor ni marcas (CA5)
    expect(analysis.fields.find((f) => f.fieldKey === "name")?.recognizedValue).toBeNull();
    expect(analysis.fields.find((f) => f.fieldKey === "career")?.recognizedValue).toBeNull();
    expect(analysis.fields.find((f) => f.fieldKey === "graduationYear")?.recognizedValue).toBeNull();
    expect(analysis.fields.every((f) => f.bbox === undefined)).toBe(true);

    // En la tabla de contraste, aparecen en vacío
    render(<DataContrastPanel detail={arbitraryDetail} ocrAnalysis={analysis} />);
    expect(screen.getByText("0 coinciden")).toBeInTheDocument();
    expect(screen.getByText("5 por verificar")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Sin datos reconocidos")).toHaveLength(3); // Nombre, Carrera, Año de egreso
    expect(screen.getAllByText(NOT_IN_DOCUMENT_TEXT)).toHaveLength(2); // Carnet y SIS
  });

  it("Lectura con discordancia: Lee el diploma aunque los datos no coincidan con el titular y los muestra gráficamente", () => {
    const mismatchDetail: ReviewDetail = {
      ...mockDetail,
      firstName: "Cristian",
      lastName: "Claros",
      career: "Licenciatura en Ingeniería de Sistemas",
      graduationYear: 2022,
      document: {
        type: "academic_diploma",
        name: "dilpoma 2",
        extension: "jpg",
        mimeType: "image/jpeg",
        size: 2048,
      },
    };

    const analysis = generateOcrAnalysis(mismatchDetail);

    // Lee los valores presentes en el documento
    expect(analysis.fields.find((f) => f.fieldKey === "name")?.recognizedValue).toBe("ELY YANINA JUÁREZ MONCADA");
    expect(analysis.fields.find((f) => f.fieldKey === "career")?.recognizedValue).toContain("BIOÉTICA");
    expect(analysis.fields.find((f) => f.fieldKey === "graduationYear")?.recognizedValue).toBe("2007");

    // Detecta que no coinciden con lo declarado
    expect(analysis.matchingCount).toBe(0);
    expect(analysis.pendingCount).toBe(5);
    expect(analysis.manualReviewReason).toBe("El nombre no coincide con los datos declarados");

    // En el visor, las marcas son rojas (CA4)
    expect(analysis.fields.find((f) => f.fieldKey === "name")?.isDoubtful).toBe(true);

    // En la tabla, se renderizan los valores leídos y se muestra gráficamente la discordancia
    render(<DataContrastPanel detail={mismatchDetail} ocrAnalysis={analysis} />);
    expect(screen.getByText("ELY YANINA JUÁREZ MONCADA")).toBeInTheDocument();
    expect(screen.getByText("0 coinciden")).toBeInTheDocument();
    expect(screen.getByText("5 por verificar")).toBeInTheDocument();
  });
});


