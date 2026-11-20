import { Injectable, Logger } from '@nestjs/common';
import * as mupdf from 'mupdf';
import { recognizeWithTesseract } from '../../../common/ocr/tesseract-ocr.js';

export interface CompanyOcrFieldResult {
  declared: string;
  detectedText: string | null;
  matched: boolean;
  confidence?: number;
  statusMessage?: string;
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

const BOLIVIAN_CITIES = [
  'cochabamba',
  'la paz',
  'santa cruz',
  'santa cruz de la sierra',
  'sucre',
  'oruro',
  'potosi',
  'potosí',
  'tarija',
  'trinidad',
  'cobija',
  'el alto',
  'sacaba',
  'quillacollo',
  'colcapirhua',
  'tiquipaya',
  'vinto',
  'montero',
  'warnes',
];

const METROPOLITAN_AREAS: Record<string, string[]> = {
  cochabamba: [
    'sacaba',
    'quillacollo',
    'colcapirhua',
    'tiquipaya',
    'vinto',
    'sipe sipe',
  ],
  'la paz': ['el alto', 'viacha', 'achocalla'],
  'santa cruz': ['warnes', 'montero', 'cotoca', 'la guardia'],
};

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
      const pageCount = Math.min(doc.countPages(), 4);
      const textChunks: string[] = [];

      for (let i = 0; i < pageCount; i += 1) {
        const page = doc.loadPage(i);
        try {
          const structuredText = page.toStructuredText('preserve-whitespace');
          const pageText = structuredText.asText();
          if (pageText && pageText.trim().length > 30) {
            textChunks.push(pageText.trim());
          } else {
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

      const extracted = textChunks.join('\n\n');
      if (extracted.trim().length > 20) {
        return extracted;
      }
      return this.recognizeImage(buffer);
    } catch (error) {
      this.logger.warn(
        `Error procesando PDF con mupdf; recurriendo a OCR de imagen directa: ${
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
      this.logger.warn(
        'Fallo en Tesseract 4.0.0_best; probando configuración default',
        err,
      );
      try {
        const fallback = await recognizeWithTesseract(buffer, 'default', [
          'spa',
        ]);
        return fallback.text ?? '';
      } catch (fallbackErr) {
        this.logger.warn(
          'No se pudo ejecutar OCR en la imagen con ningún modelo',
          fallbackErr,
        );
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
    const squashedFullText = this.squash(text);

    const kv = this.extractKeyValuePairs(lines);

    const emails = this.extractEmails(text);
    const urls = this.extractUrls(text);
    const phones = this.extractPhones(text);
    const detectedCities = this.extractCities(lines);

    const companyEvaluation = this.matchCompanyName(
      data.companyName,
      lines,
      kv,
      normalizedFullText,
      squashedFullText,
    );

    const cityEvaluation = this.matchCity(
      data.city,
      lines,
      kv,
      detectedCities,
      normalizedFullText,
    );

    const emailEvaluation = this.matchEmail(
      data.email,
      kv,
      emails,
      squashedFullText,
    );

    const phoneEvaluation = this.matchPhone(
      data.phone,
      kv,
      phones,
      squashedFullText,
    );

    const websiteEvaluation = this.matchWebsite(
      data.websiteUrl,
      kv,
      urls,
      normalizedFullText,
    );

    const sectorEvaluation = this.matchSector(
      data.sector,
      lines,
      kv,
      normalizedFullText,
    );

    const intentEvaluation = this.matchRequestIntent(lines, normalizedFullText);

    const fields = {
      companyName: companyEvaluation,
      city: cityEvaluation,
      email: emailEvaluation,
      phone: phoneEvaluation,
      websiteUrl: websiteEvaluation,
      sector: sectorEvaluation,
      requestIntent: intentEvaluation,
    };

    const weights = {
      companyName: 25,
      requestIntent: 20,
      sector: 15,
      city: 15,
      email: 10,
      phone: 10,
      websiteUrl: 5,
    };

    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      if (fields[key as keyof typeof fields].matched) {
        totalScore += weight;
      }
    }

    return {
      extractedText: text,
      matchScore: totalScore,
      fields,
    };
  }

  private extractKeyValuePairs(lines: string[]): Map<string, string> {
    const kv = new Map<string, string>();
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 45) {
        const k = this.normalize(line.slice(0, colonIdx));
        const v = line.slice(colonIdx + 1).trim();
        if (v) kv.set(k, v);
      }

      const normLine = this.normalize(line);
      if (
        (normLine === 'razon social' ||
          normLine === 'rubro / sector' ||
          normLine === 'rubro' ||
          normLine === 'sector' ||
          normLine === 'correo corporativo' ||
          normLine === 'correo electronico' ||
          normLine === 'telefono de contacto' ||
          normLine === 'telefono' ||
          normLine === 'sitio web oficial' ||
          normLine === 'sitio web' ||
          normLine === 'ciudad' ||
          normLine === 'sede' ||
          normLine === 'ciudad sede') &&
        i + 1 < lines.length
      ) {
        const nextVal = lines[i + 1].trim();
        if (nextVal && !nextVal.includes(':') && nextVal.length < 120) {
          kv.set(normLine, nextVal);
        }
      }
    }
    return kv;
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    return Array.from(new Set(text.match(emailRegex) ?? []));
  }

  private extractUrls(text: string): string[] {
    const urlRegex =
      /(?:https?:\/\/|www\.)[^\s\)\],;]+|[a-zA-Z0-9-]+\.(?:bo|com|org|net|io|tech)(?:\/[^\s\)\],;]*)?/gi;
    return Array.from(new Set(text.match(urlRegex) ?? [])).filter(
      (u) =>
        !u.includes('@') && u.length > 5 && !u.startsWith('http://www.w3.org'),
    );
  }

  private extractPhones(text: string): string[] {
    const phoneMatches =
      text.match(/(?:(?:\+?591[\s-]?)?(?:[23467]\d{7}|[234]\d{6}))/g) ?? [];
    return Array.from(
      new Set(
        phoneMatches
          .map((p) => p.replace(/\D/g, ''))
          .filter((p) => p.length >= 7),
      ),
    );
  }

  private extractCities(lines: string[]): { city: string; line: string }[] {
    const detected: { city: string; line: string }[] = [];
    for (const line of lines) {
      const norm = this.normalize(line);
      for (const city of BOLIVIAN_CITIES) {
        if (new RegExp(`\\b${city}\\b`, 'i').test(norm)) {
          detected.push({ city, line });
          break;
        }
      }
    }
    return detected;
  }

  private matchCompanyName(
    declaredName: string,
    lines: string[],
    kv: Map<string, string>,
    normalizedFullText: string,
    squashedFullText: string,
  ): CompanyOcrFieldResult {
    let detectedName: string | null =
      kv.get('razon social') ??
      kv.get('nombre de la empresa') ??
      kv.get('empresa') ??
      null;

    if (!detectedName) {
      for (const line of lines) {
        const match = line.match(
          /en representaci[oó]n de la empresa\s+([^,.\n]+)/i,
        );
        if (match) {
          detectedName = match[1].trim();
          break;
        }
      }
    }

    if (!detectedName) {
      for (const line of lines) {
        const match = line.match(/Gerente General\s*[-—]\s*([^,.\n]+)/i);
        if (match) {
          detectedName = match[1].trim();
          break;
        }
      }
    }

    if (!detectedName && lines.length > 0) {
      const candidateHeader = lines.slice(0, 3).find((l) => {
        const nl = this.normalize(l);
        return (
          !nl.includes('cite') &&
          !nl.includes('senores') &&
          !nl.includes('pagina') &&
          l.length > 3
        );
      });
      if (candidateHeader) detectedName = candidateHeader;
    }

    const cleanDeclared = this.stripLegalSuffixes(declaredName);
    const cleanDetected = detectedName
      ? this.stripLegalSuffixes(detectedName)
      : '';

    const squashedDeclared = this.squash(cleanDeclared);
    const squashedDetected = this.squash(cleanDetected);

    const isDirectMatch =
      squashedDeclared.length > 2 &&
      (squashedFullText.includes(squashedDeclared) ||
        (squashedDetected.length > 2 &&
          (squashedDetected.includes(squashedDeclared) ||
            squashedDeclared.includes(squashedDetected))));

    const diceScore = this.diceCoefficient(cleanDeclared, cleanDetected);
    const matched = isDirectMatch || diceScore > 0.45;

    return {
      declared: declaredName,
      detectedText: detectedName ?? (matched ? declaredName : null),
      matched,
      confidence: Math.round(
        Math.max(matched ? 85 : 20, Math.min(100, diceScore * 100)),
      ),
      statusMessage: matched
        ? 'Razón social identificada y validada en el documento'
        : detectedName
          ? 'Razón social detectada difiere del formulario de registro'
          : 'No se detectó razón social en el texto de la carta',
    };
  }

  private matchCity(
    declaredCity: string,
    lines: string[],
    kv: Map<string, string>,
    detectedCities: { city: string; line: string }[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const declaredCityNorm = this.normalize(declaredCity);
    let detectedCityText: string | null =
      kv.get('ciudad') ?? kv.get('sede') ?? kv.get('ciudad sede') ?? null;
    let matched = false;

    const foundCity = detectedCities[0];
    if (foundCity) {
      const cityNameCap =
        foundCity.city.charAt(0).toUpperCase() + foundCity.city.slice(1);

      if (
        this.normalize(foundCity.city) === declaredCityNorm ||
        normalizedFullText.includes(declaredCityNorm)
      ) {
        matched = true;
        detectedCityText = `${cityNameCap} (${foundCity.line})`;
      } else {
        const metroChildren = METROPOLITAN_AREAS[foundCity.city] ?? [];
        if (metroChildren.includes(declaredCityNorm)) {
          matched = true;
          detectedCityText = `${cityNameCap} [Región Metropolitana con ${declaredCity}] (${foundCity.line})`;
        } else {
          detectedCityText = `${cityNameCap} (${foundCity.line})`;
        }
      }
    } else if (normalizedFullText.includes(declaredCityNorm)) {
      matched = true;
      const matchingLine = lines.find((l) =>
        this.normalize(l).includes(declaredCityNorm),
      );
      detectedCityText = matchingLine ?? declaredCity;
    }

    return {
      declared: declaredCity,
      detectedText: detectedCityText,
      matched,
      confidence: matched ? 90 : 30,
      statusMessage: matched
        ? 'Ciudad sede o área metropolitana validada en la carta'
        : detectedCityText
          ? 'Ciudad en carta no coincide con la sede registrada'
          : 'No se detectó mención de ciudad en el documento',
    };
  }

  private matchEmail(
    declaredEmail: string,
    kv: Map<string, string>,
    emails: string[],
    squashedFullText: string,
  ): CompanyOcrFieldResult {
    const cleanDeclaredEmail = declaredEmail.trim().toLowerCase();
    const declaredDomain = cleanDeclaredEmail.split('@')[1];

    const detectedEmail =
      kv.get('correo corporativo') ??
      kv.get('correo electronico') ??
      kv.get('email') ??
      emails[0] ??
      null;

    let matched = false;
    if (detectedEmail) {
      const cleanDetected = detectedEmail.trim().toLowerCase();
      const detectedDomain = cleanDetected.split('@')[1];

      if (cleanDeclaredEmail === cleanDetected) {
        matched = true;
      } else if (
        declaredDomain &&
        detectedDomain &&
        declaredDomain === detectedDomain
      ) {
        matched = true;
      } else if (squashedFullText.includes(this.squash(cleanDeclaredEmail))) {
        matched = true;
      }
    }

    return {
      declared: declaredEmail,
      detectedText: detectedEmail,
      matched,
      confidence: matched ? 95 : detectedEmail ? 50 : 10,
      statusMessage: matched
        ? 'Correo verificado institucionalmente en el documento'
        : detectedEmail
          ? 'Correo declarado no coincide con el correo de la carta'
          : 'No se encontró correo corporativo en el documento',
    };
  }

  private matchPhone(
    declaredPhone: string,
    kv: Map<string, string>,
    phones: string[],
    squashedFullText: string,
  ): CompanyOcrFieldResult {
    const declaredDigits = declaredPhone.replace(/\D/g, '');
    let matched = false;

    if (
      declaredDigits.length >= 6 &&
      (squashedFullText.includes(declaredDigits) ||
        phones.some(
          (p) => p.includes(declaredDigits) || declaredDigits.includes(p),
        ))
    ) {
      matched = true;
    }

    let detectedText: string | null =
      kv.get('telefono de contacto') ??
      kv.get('telefono') ??
      kv.get('celular') ??
      null;

    if (!detectedText && phones.length > 0) {
      detectedText = phones.join(' · ');
    }

    return {
      declared: declaredPhone,
      detectedText,
      matched,
      confidence: matched ? 90 : detectedText ? 40 : 10,
      statusMessage: matched
        ? 'Número de contacto constatado en el documento'
        : detectedText
          ? 'Teléfono del registro no concuerda con los números de la carta'
          : 'No se detectó línea telefónica en la carta',
    };
  }

  private matchWebsite(
    declaredUrl: string | null | undefined,
    kv: Map<string, string>,
    urls: string[],
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    const declared = declaredUrl?.trim() || 'No especificado (Opcional)';
    const detectedUrl =
      kv.get('sitio web oficial') ??
      kv.get('sitio web') ??
      kv.get('web') ??
      urls[0] ??
      null;

    let matched = false;
    if (detectedUrl) {
      if (
        !declaredUrl ||
        declaredUrl.trim() === '' ||
        declared.includes('No especificado')
      ) {
        matched = true;
      } else {
        const cleanDec = declaredUrl
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];
        const cleanDet = detectedUrl
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];
        matched =
          cleanDec === cleanDet ||
          cleanDet.includes(cleanDec) ||
          normalizedFullText.includes(cleanDec);
      }
    } else if (!declaredUrl || declaredUrl.trim() === '') {
      matched = true;
    }

    return {
      declared,
      detectedText: detectedUrl,
      matched,
      confidence: matched ? 90 : 25,
      statusMessage: matched
        ? 'URL corporativa validada con el sitio web oficial'
        : detectedUrl
          ? 'URL declarada difiere de la detectada en la carta'
          : 'Sitio web no indicado en el documento',
    };
  }

  private matchSector(
    declaredSector: string,
    lines: string[],
    kv: Map<string, string>,
    normalizedFullText: string,
  ): CompanyOcrFieldResult {
    let detectedSector =
      kv.get('rubro / sector') ??
      kv.get('rubro') ??
      kv.get('sector') ??
      kv.get('giro comercial') ??
      null;

    if (!detectedSector) {
      for (const line of lines) {
        const match = line.match(
          /(?:dedicada al rubro de|especializada en)\s+([^,.\n]+)/i,
        );
        if (match) {
          detectedSector = match[1].trim();
          break;
        }
      }
    }

    const declaredSectorNorm = this.normalize(declaredSector);
    const detectedSectorNorm = this.normalize(detectedSector ?? '');
    const tokens = declaredSectorNorm.split(/\s+/).filter((t) => t.length >= 3);

    const matched =
      Boolean(detectedSector) &&
      (detectedSectorNorm.includes(declaredSectorNorm) ||
        declaredSectorNorm.includes(detectedSectorNorm) ||
        tokens.some((t) => detectedSectorNorm.includes(t)) ||
        tokens.some((t) => normalizedFullText.includes(t)) ||
        this.diceCoefficient(declaredSectorNorm, detectedSectorNorm) > 0.3);

    return {
      declared: declaredSector,
      detectedText: detectedSector,
      matched,
      confidence: matched ? 85 : 30,
      statusMessage: matched
        ? 'Rubro o especialidad económica validada con el expediente'
        : detectedSector
          ? 'Rubro declarado difiere del giro expresado en la carta'
          : 'Giro o rubro económico no especificado en el documento',
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

    let detectedIntent: string | null = null;
    const refLine = lines.find((l) => /ref\.:?/i.test(l));

    let recipientLine: string | null = null;
    const senoresIdx = lines.findIndex((l) => /^se[ñn]ores:?$/i.test(l));
    if (senoresIdx !== -1 && senoresIdx + 1 < lines.length) {
      recipientLine = lines[senoresIdx + 1];
    } else {
      recipientLine =
        lines.find((l) =>
          /(?:carrera de ingenier[ií]a|facultad de|jefatura de carrera|direcci[oó]n de carrera)/i.test(
            l,
          ),
        ) ?? null;
    }

    if (refLine) {
      detectedIntent = recipientLine
        ? `${refLine} (Dirigido a: ${recipientLine})`
        : refLine;
    } else if (matched) {
      detectedIntent =
        'Solicitud formal de cuenta institucional dirigida a la carrera/facultad en UMSSY';
    }

    return {
      declared: 'Carta formal de solicitud de acceso a UMSSY',
      detectedText: detectedIntent,
      matched,
      confidence: matched ? 95 : 20,
      statusMessage: matched
        ? 'Petición institucional formal dirigida a la carrera y facultad'
        : 'No se identifica referencia formal de solicitud a la UMSS',
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

  private squash(str: string): string {
    return this.normalize(str).replace(/[\s\W_]+/g, '');
  }

  private stripLegalSuffixes(name: string): string {
    let cleaned = this.normalize(name);
    for (const suffix of LEGAL_SUFFIXES) {
      const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
    }
    return cleaned.replace(/[\s\W_]+/g, ' ').trim();
  }

  private getBigrams(str: string): Set<string> {
    const s = this.squash(str);
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i += 1) {
      bigrams.add(s.slice(i, i + 2));
    }
    return bigrams;
  }

  private diceCoefficient(str1: string, str2: string): number {
    const b1 = this.getBigrams(str1);
    const b2 = this.getBigrams(str2);
    if (b1.size === 0 || b2.size === 0) return 0;
    let intersection = 0;
    for (const bg of b1) {
      if (b2.has(bg)) intersection += 1;
    }
    return (2 * intersection) / (b1.size + b2.size);
  }
}
