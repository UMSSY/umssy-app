import { Injectable, Logger } from '@nestjs/common';
import * as mupdf from 'mupdf';
import { recognizeWithTesseract } from '../../../common/ocr/tesseract-ocr.js';

export interface CompanyOcrFieldResult {
  declared: string;
  detectedText: string | null;
  matched: boolean;
}

export interface CompanyOcrAnalysis {
  extractedText: string;
  matchScore: number;
  fields: {
    companyName: CompanyOcrFieldResult;
    city: CompanyOcrFieldResult;
    email: CompanyOcrFieldResult;
    phone: CompanyOcrFieldResult;
    websiteUrl: CompanyOcrFieldResult;
    sector: CompanyOcrFieldResult;
    requestIntent: CompanyOcrFieldResult;
  };
}

export interface CompanyOcrInputData {
  companyName: string;
  city: string;
  email: string;
  phone: string;
  websiteUrl?: string | null;
  sector: string;
}

const LEGAL_SUFFIXES = [
  's.r.l.',
  'srl',
  's.a.',
  'sa',
  'sociedad de responsabilidad limitada',
  'sociedad anonima',
  'sociedad anónima',
  'ltda.',
  'ltda',
  'de s.r.l.',
  'corp.',
  'corporation',
  'cia.',
  'unipersonal',
];

@Injectable()
export class CompanyDocumentOcrService {
  private readonly logger = new Logger(CompanyDocumentOcrService.name);

  async analyze(
    buffer: Buffer,
    mimeType: string,
    data: CompanyOcrInputData,
  ): Promise<CompanyOcrAnalysis> {
    const rawText = await this.extractRawText(buffer, mimeType);
    return this.evaluateDocumentText(rawText, data);
  }

  private async extractRawText(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const isPdf =
      mimeType === 'application/pdf' ||
      buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-');

    if (!isPdf) {
      return this.recognizeImage(buffer);
    }

    try {
      const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
      const pageCount = Math.min(doc.countPages(), 3);
      const textChunks: string[] = [];

      for (let i = 0; i < pageCount; i += 1) {
        const page = doc.loadPage(i);
        try {
          const structuredText = page.toStructuredText('preserve-whitespace');
          const pageText = structuredText.asText();
          if (pageText && pageText.trim().length > 30) {
            textChunks.push(pageText.trim());
          } else {
            // Documento escaneado sin capa de texto digital: fallback a OCR
            const pixmap = page.toPixmap(
              mupdf.Matrix.scale(2, 2),
              mupdf.ColorSpace.DeviceRGB,
              false,
              true,
            );
            try {
              const ocrResult = await this.recognizeImage(
                Buffer.from(pixmap.asPNG()),
              );
              if (ocrResult.trim()) textChunks.push(ocrResult.trim());
            } finally {
              pixmap.destroy();
            }
          }
        } finally {
          page.destroy();
        }
      }

      return textChunks.join('\n\n');
    } catch (error) {
      this.logger.warn(
        `Error procesando PDF con mupdf; intentando reconocimiento directo de imagen: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.recognizeImage(buffer);
    }
  }

  private async recognizeImage(buffer: Buffer): Promise<string> {
    try {
      const result = await recognizeWithTesseract(buffer, '4.0.0_best', [
        'spa',
      ]);
      return result.text ?? '';
    } catch (err) {
      this.logger.warn('Fallo en Tesseract 4.0.0_best; probando default', err);
      try {
        const fallback = await recognizeWithTesseract(buffer, 'default', [
          'spa',
        ]);
        return fallback.text ?? '';
      } catch (fallbackErr) {
        this.logger.warn('No se pudo ejecutar OCR en la imagen', fallbackErr);
        return '';
      }
    }
  }

  public evaluateDocumentText(
    text: string,
    data: CompanyOcrInputData,
  ): CompanyOcrAnalysis {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const normalizedFullText = this.normalize(text);
    const squashedFullText = normalizedFullText.replace(/[\s\W_]+/g, '');

    // 1. Razón Social / Nombre de la empresa
    const companyEvaluation = this.matchCompanyName(
      data.companyName,
      lines,
      normalizedFullText,
      squashedFullText,
    );

    // 2. Ciudad / Ubicación
    const cityEvaluation = this.matchCity(data.city, lines, normalizedFullText);

    // 3. Correo Electrónico
    const emailEvaluation = this.matchEmail(
      data.email,
      lines,
      normalizedFullText,
    );

    // 4. Teléfono
    const phoneEvaluation = this.matchPhone(
      data.phone,
      lines,
      normalizedFullText,
      squashedFullText,
    );

    // 5. Sitio Web
    const websiteEvaluation = this.matchWebsite(
      data.websiteUrl,
      lines,
      normalizedFullText,
    );

    // 6. Rubro / Sector
    const sectorEvaluation = this.matchSector(
      data.sector,
      lines,
      normalizedFullText,
    );

    // 7. Intención formal de solicitud de acceso a UMSSY
    const requestIntentEvaluation = this.matchRequestIntent(
      lines,
      normalizedFullText,
    );

    // Ponderación del score (0 a 100%)
    let score = 0;
    if (companyEvaluation.matched) score += 35;
    if (requestIntentEvaluation.matched) score += 25;
    if (cityEvaluation.matched) score += 15;
    if (emailEvaluation.matched || phoneEvaluation.matched) score += 15;
    if (sectorEvaluation.matched) score += 10;

    return {
      extractedText: text,
      matchScore: Math.min(100, score),
      fields: {
        companyName: companyEvaluation,
        city: cityEvaluation,
        email: emailEvaluation,
        phone: phoneEvaluation,
        websiteUrl: websiteEvaluation,
        sector: sectorEvaluation,
        requestIntent: requestIntentEvaluation,
      },
    };
  }

  private matchCompanyName(
    declaredName: string,
    lines: string[],
    normalizedFullText: string,
    squashedFullText: string,
  ): CompanyOcrFieldResult {
    const cleanDeclared = this.normalize(declaredName);
    const squashedDeclared = cleanDeclared.replace(/[\s\W_]+/g, '');

    // Quitar sufijos legales (S.R.L., S.A., etc.)
    let baseCompanyWords = cleanDeclared;
    for (const suffix of LEGAL_SUFFIXES) {
      baseCompanyWords = baseCompanyWords.replace(
        new RegExp(`\\b${suffix}\\b`, 'gi'),
        '',
      );
    }
    const tokens = baseCompanyWords.split(/\s+/).filter((t) => t.length >= 2);

    let matched = false;
    let detectedText: string | null = null;

    // A) Búsqueda directa del nombre completo o sin espacios
    if (
      normalizedFullText.includes(cleanDeclared) ||
      squashedFullText.includes(squashedDeclared)
    ) {
      matched = true;
    }

    // B) Búsqueda por línea para extraer el fragmento exacto del documento
    for (const line of lines) {
      const normLine = this.normalize(line);
      const squashedLine = normLine.replace(/[\s\W_]+/g, '');

      if (
        normLine.includes(cleanDeclared) ||
        squashedLine.includes(squashedDeclared)
      ) {
        matched = true;
        detectedText = line;
        break;
      }

      // Si todos los tokens clave están en la misma línea
      if (tokens.length > 0 && tokens.every((tok) => normLine.includes(tok))) {
        matched = true;
        detectedText = line;
        break;
      }
    }

    // Si hubo coincidencia pero no se aisló una sola línea, tomar la primera con algún token
    if (matched && !detectedText) {
      const candidate = lines.find((l) => {
        const nl = this.normalize(l);
        return tokens.some((t) => nl.includes(t));
      });
      detectedText = candidate ?? declaredName;
    }

    return {
      declared: declaredName,
      detectedText,
      matched,
    };
  }

  private matchCity(
    declaredCity: string,
    lines: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const cleanCity = this.normalize(declaredCity);
    const matched = normalizedFullText.includes(cleanCity);
    let detectedText: string | null = null;

    if (matched) {
      const line = lines.find((l) => this.normalize(l).includes(cleanCity));
      detectedText = line ?? declaredCity;
    }

    return {
      declared: declaredCity,
      detectedText,
      matched,
    };
  }

  private matchEmail(
    declaredEmail: string,
    lines: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const cleanEmail = declaredEmail.trim().toLowerCase();
    const domain = cleanEmail.split('@')[1];
    let matched = false;
    let detectedText: string | null = null;

    if (normalizedFullText.includes(cleanEmail)) {
      matched = true;
      detectedText = declaredEmail;
    } else if (domain && normalizedFullText.includes(domain)) {
      matched = true;
      const foundLine = lines.find((l) => l.toLowerCase().includes(domain));
      detectedText = foundLine ?? `@${domain}`;
    }

    if (!detectedText) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      for (const line of lines) {
        const match = line.match(emailRegex);
        if (match) {
          detectedText = match[0];
          break;
        }
      }
    }

    return {
      declared: declaredEmail,
      detectedText,
      matched,
    };
  }

  private matchPhone(
    declaredPhone: string,
    lines: string[],
    normalizedFullText: string,
    squashedFullText: string,
  ): CompanyOcrFieldResult {
    const digitsOnly = declaredPhone.replace(/\D/g, '');
    let matched = false;
    let detectedText: string | null = null;

    if (digitsOnly.length >= 6 && squashedFullText.includes(digitsOnly)) {
      matched = true;
      const line = lines.find((l) => l.replace(/\D/g, '').includes(digitsOnly));
      detectedText = line ?? declaredPhone;
    }

    return {
      declared: declaredPhone,
      detectedText,
      matched,
    };
  }

  private matchWebsite(
    declaredUrl: string | null | undefined,
    lines: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const declared = declaredUrl?.trim() || 'No especificado';
    if (!declaredUrl || declaredUrl.trim() === '') {
      return {
        declared: 'No especificado (Opcional)',
        detectedText: null,
        matched: false,
      };
    }

    const cleanHost = declaredUrl
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const matched =
      cleanHost.length > 3 && normalizedFullText.includes(cleanHost);
    let detectedText: string | null = null;

    if (matched) {
      const line = lines.find((l) => l.toLowerCase().includes(cleanHost));
      detectedText = line ?? declaredUrl;
    }

    return {
      declared: declaredUrl,
      detectedText,
      matched,
    };
  }

  private matchSector(
    declaredSector: string,
    lines: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const cleanSector = this.normalize(declaredSector);
    const tokens = cleanSector.split(/\s+/).filter((t) => t.length >= 3);
    const matched =
      tokens.length > 0 &&
      tokens.some((token) => normalizedFullText.includes(token));

    let detectedText: string | null = null;
    if (matched) {
      const line = lines.find((l) => {
        const nl = this.normalize(l);
        return tokens.some((t) => nl.includes(t));
      });
      detectedText = line ?? declaredSector;
    }

    return {
      declared: declaredSector,
      detectedText,
      matched,
    };
  }

  private matchRequestIntent(
    lines: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const hasIntentKeyword =
      normalizedFullText.includes('solicitud') ||
      normalizedFullText.includes('solicitamos') ||
      normalizedFullText.includes('acceso') ||
      normalizedFullText.includes('plataforma') ||
      normalizedFullText.includes('umssy') ||
      normalizedFullText.includes('acreditacion') ||
      normalizedFullText.includes('cuenta empresarial') ||
      normalizedFullText.includes('reclutador');

    const hasInstitutionKeyword =
      normalizedFullText.includes('sistemas') ||
      normalizedFullText.includes('informatica') ||
      normalizedFullText.includes('umss') ||
      normalizedFullText.includes('san simon') ||
      normalizedFullText.includes('facultad') ||
      normalizedFullText.includes('tecnologia');

    const matched = hasIntentKeyword && hasInstitutionKeyword;
    let detectedText: string | null = null;

    if (matched) {
      const candidateLine = lines.find((l) => {
        const nl = this.normalize(l);
        return (
          nl.includes('solicitud') ||
          nl.includes('solicitamos') ||
          nl.includes('acceso') ||
          nl.includes('ref')
        );
      });
      detectedText =
        candidateLine ??
        'Petición formal de acceso dirigida a la carrera o facultad de la UMSS';
    }

    return {
      declared: 'Carta formal de solicitud de acceso a UMSSY',
      detectedText,
      matched,
    };
  }

  private normalize(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\s\t\r\n]+/g, ' ')
      .trim();
  }
}
