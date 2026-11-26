import { Injectable } from "@nestjs/common";
import { SimplePdfDocument } from "../../../common/utils/simple-pdf-document.js";
import {
  CV_PDF_COLORS,
  CV_PDF_FONTS,
  CV_PDF_PAGE,
} from "../constants/cv-pdf.constants.js";
import type {
  CvCertificationItem,
  CvDocumentData,
  CvEducation,
  CvProjectItem,
  CvWorkExperience,
} from "../types/cv-document-data.type.js";
import type { CvPdfRenderOptions } from "../types/cv-pdf-options.type.js";
import type { PdfPageStream } from "../types/pdf-page-stream.type.js";

@Injectable()
export class CvPdfGeneratorService {
  public generate(
    data: CvDocumentData,
    options?: CvPdfRenderOptions,
  ): Buffer {
    const pages: PdfPageStream[] = [];
    let currentPage: PdfPageStream = { operations: [] };
    pages.push(currentPage);

    let currentY = CV_PDF_PAGE.HEIGHT - CV_PDF_PAGE.MARGIN_TOP;
    let pageNumber = 1;

    const startNewPage = () => {
      currentPage = { operations: [] };
      pages.push(currentPage);
      pageNumber += 1;
      currentY = CV_PDF_PAGE.HEIGHT - CV_PDF_PAGE.MARGIN_TOP;
      this.drawTopAccentBar(currentPage);
      this.drawContinuationHeader(currentPage, data.personalInfo.fullName, currentY);
      currentY -= 32;
    };

    const ensureSpace = (neededHeight: number) => {
      if (currentY - neededHeight < CV_PDF_PAGE.MARGIN_BOTTOM + 25) {
        startNewPage();
      }
    };

    const sections = options?.sections;
    const includeContactInfo = sections?.includeContactInfo !== false;

    this.drawTopAccentBar(currentPage);
    currentY = this.drawMainHeader(currentPage, data.personalInfo, currentY, includeContactInfo);


    if (sections?.includeSummary !== false && data.summary?.trim()) {
      ensureSpace(60);
      currentY = this.drawSectionHeader(currentPage, "PRESENTACIÓN PROFESIONAL", currentY);
      currentY = this.drawParagraph(currentPage, data.summary.trim(), currentY, ensureSpace);
      currentY -= 10;
    }

    if (
      sections?.includeWorkExperience !== false &&
      data.workExperiences &&
      data.workExperiences.length > 0
    ) {
      ensureSpace(65);
      currentY = this.drawSectionHeader(currentPage, "EXPERIENCIA LABORAL", currentY);
      for (const exp of data.workExperiences) {
        currentY = this.drawExperienceItem(currentPage, exp, currentY, ensureSpace);
      }
      currentY -= 6;
    }

    if (
      sections?.includeEducation !== false &&
      data.educations &&
      data.educations.length > 0
    ) {
      ensureSpace(60);
      currentY = this.drawSectionHeader(currentPage, "FORMACIÓN ACADÉMICA", currentY);
      for (const edu of data.educations) {
        currentY = this.drawEducationItem(currentPage, edu, currentY, ensureSpace);
      }
      currentY -= 6;
    }

    if (
      sections?.includeSkills !== false &&
      data.skills &&
      data.skills.length > 0
    ) {
      ensureSpace(45);
      currentY = this.drawSectionHeader(currentPage, "HABILIDADES TÉCNICAS", currentY);
      currentY = this.drawSkills(currentPage, data.skills.map((s) => s.name), currentY, ensureSpace);
      currentY -= 10;
    }

    if (
      sections?.includeCertifications !== false &&
      data.certifications &&
      data.certifications.length > 0
    ) {
      ensureSpace(50);
      currentY = this.drawSectionHeader(currentPage, "CERTIFICACIONES", currentY);
      for (const cert of data.certifications) {
        currentY = this.drawCertificationItem(currentPage, cert, currentY, ensureSpace);
      }
      currentY -= 6;
    }

    if (
      sections?.includeProjects !== false &&
      data.projects &&
      data.projects.length > 0
    ) {
      ensureSpace(55);
      currentY = this.drawSectionHeader(currentPage, "PROYECTOS DESTACADOS", currentY);
      for (const proj of data.projects) {
        currentY = this.drawProjectItem(currentPage, proj, currentY, ensureSpace);
      }
    }

    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      this.drawPageFooter(pages[i], i + 1, totalPages);
    }

    return this.compilePdfBuffer(pages);
  }

  private drawText(
    page: PdfPageStream,
    text: string,
    font: string,
    fontSize: number,
    color: readonly [number, number, number],
    x: number,
    y: number,
  ): void {
    const [r, g, b] = color;
    page.operations.push(
      `BT ${font} ${fontSize} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${this.escapePdfText(text)}) Tj ET`,
    );
  }

  private drawTopAccentBar(page: PdfPageStream): void {
    const [r, g, b] = CV_PDF_COLORS.PRIMARY;
    page.operations.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
      `0 ${(CV_PDF_PAGE.HEIGHT - 4).toFixed(2)} ${CV_PDF_PAGE.WIDTH.toFixed(2)} 4 re f`,
    );
  }

  private drawMainHeader(
    page: PdfPageStream,
    info: CvDocumentData["personalInfo"],
    startY: number,
    includeContactInfo = true,
  ): number {
    let y = startY;

    this.drawText(
      page,
      info.fullName,
      CV_PDF_FONTS.BOLD,
      20,
      CV_PDF_COLORS.PRIMARY,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );
    y -= 18;

    if (info.headline?.trim()) {
      this.drawText(
        page,
        info.headline.trim(),
        CV_PDF_FONTS.BOLD,
        11,
        CV_PDF_COLORS.TEXT_MUTED,
        CV_PDF_PAGE.MARGIN_LEFT,
        y,
      );
      y -= 16;
    }

    const contactParts: string[] = [];
    if (includeContactInfo) {
      if (info.email) contactParts.push(info.email);
      if (info.phone) contactParts.push(info.phone);
      if (info.location) contactParts.push(info.location);
      if (info.linkedinUrl) contactParts.push(info.linkedinUrl.replace(/^https?:\/\//, ""));
      if (info.githubUrl) contactParts.push(info.githubUrl.replace(/^https?:\/\//, ""));
      if (info.gitlabUrl) contactParts.push(info.gitlabUrl.replace(/^https?:\/\//, ""));
      if (info.portfolioUrl) contactParts.push(info.portfolioUrl.replace(/^https?:\/\//, ""));
    }

    if (contactParts.length > 0) {
      const contactText = contactParts.join("  •  ");
      const lines = this.wrapText(contactText, 85);
      for (const line of lines) {
        this.drawText(
          page,
          line,
          CV_PDF_FONTS.REGULAR,
          8.5,
          CV_PDF_COLORS.TEXT_MUTED,
          CV_PDF_PAGE.MARGIN_LEFT,
          y,
        );
        y -= 12;
      }
    }

    y -= 4;
    const [lr, lg, lb] = CV_PDF_COLORS.LINE_MUTED;
    page.operations.push(
      `${lr.toFixed(3)} ${lg.toFixed(3)} ${lb.toFixed(3)} RG 0.75 w`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} m ${(CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT).toFixed(2)} ${y.toFixed(2)} l S`,
    );
    y -= 14;

    return y;
  }

  private drawContinuationHeader(
    page: PdfPageStream,
    fullName: string,
    startY: number,
  ): void {
    const y = startY - 5;
    const continuationText = `${fullName}  •  Currículum Vitae`;
    this.drawText(
      page,
      continuationText,
      CV_PDF_FONTS.REGULAR,
      8.5,
      CV_PDF_COLORS.TEXT_MUTED,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    const [lr, lg, lb] = CV_PDF_COLORS.LINE_MUTED;
    page.operations.push(
      `${lr.toFixed(3)} ${lg.toFixed(3)} ${lb.toFixed(3)} RG 0.5 w`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${(y - 6).toFixed(2)} m ${(CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT).toFixed(2)} ${(y - 6).toFixed(2)} l S`,
    );
  }

  private drawSectionHeader(
    page: PdfPageStream,
    title: string,
    startY: number,
  ): number {
    let y = startY;
    const [pr, pg, pb] = CV_PDF_COLORS.PRIMARY;

    page.operations.push(
      `${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${(y - 2).toFixed(2)} 3 11 re f`,
    );

    this.drawText(
      page,
      title,
      CV_PDF_FONTS.BOLD,
      10.5,
      CV_PDF_COLORS.PRIMARY,
      CV_PDF_PAGE.MARGIN_LEFT + 7,
      y,
    );
    y -= 6;

    const [lr, lg, lb] = CV_PDF_COLORS.LINE_MUTED;
    page.operations.push(
      `${lr.toFixed(3)} ${lg.toFixed(3)} ${lb.toFixed(3)} RG 0.5 w`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} m ${(CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT).toFixed(2)} ${y.toFixed(2)} l S`,
    );
    y -= 12;

    return y;
  }

  private drawParagraph(
    page: PdfPageStream,
    text: string,
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    let y = startY;
    const lines = this.wrapText(text, 96);

    for (const line of lines) {
      ensureSpace(14);
      this.drawText(
        page,
        line,
        CV_PDF_FONTS.REGULAR,
        9,
        CV_PDF_COLORS.TEXT_MAIN,
        CV_PDF_PAGE.MARGIN_LEFT,
        y,
      );
      y -= 12.5;
    }

    return y;
  }

  private drawExperienceItem(
    page: PdfPageStream,
    exp: CvWorkExperience,
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    ensureSpace(35);
    let y = startY;

    this.drawText(
      page,
      exp.jobTitle,
      CV_PDF_FONTS.BOLD,
      9.5,
      CV_PDF_COLORS.TEXT_MAIN,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    const dateSpan = this.formatDateSpan(exp.startDate, exp.endDate, exp.isCurrent);
    if (dateSpan) {
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateSpan.length * 5.2;
      this.drawText(
        page,
        dateSpan,
        CV_PDF_FONTS.OBLIQUE,
        8.5,
        CV_PDF_COLORS.TEXT_MUTED,
        xRight,
        y,
      );
    }
    y -= 12;

    const companyText = exp.location ? `${exp.company}  •  ${exp.location}` : exp.company;
    this.drawText(
      page,
      companyText,
      CV_PDF_FONTS.REGULAR,
      8.5,
      CV_PDF_COLORS.TEXT_MUTED,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );
    y -= 12;

    if (exp.description?.trim()) {
      const descLines = this.wrapText(exp.description.trim(), 95);
      for (const line of descLines) {
        ensureSpace(14);
        this.drawText(
          page,
          line,
          CV_PDF_FONTS.REGULAR,
          8.5,
          CV_PDF_COLORS.TEXT_MAIN,
          CV_PDF_PAGE.MARGIN_LEFT,
          y,
        );
        y -= 11.5;
      }
    }

    y -= 4;
    return y;
  }

  private drawEducationItem(
    page: PdfPageStream,
    edu: CvEducation,
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    ensureSpace(30);
    let y = startY;

    this.drawText(
      page,
      edu.degree,
      CV_PDF_FONTS.BOLD,
      9.5,
      CV_PDF_COLORS.TEXT_MAIN,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    const dateSpan = this.formatDateSpan(edu.startDate, edu.endDate, edu.isCurrent);
    if (dateSpan) {
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateSpan.length * 5.2;
      this.drawText(
        page,
        dateSpan,
        CV_PDF_FONTS.OBLIQUE,
        8.5,
        CV_PDF_COLORS.TEXT_MUTED,
        xRight,
        y,
      );
    }
    y -= 12;

    const instText = edu.location ? `${edu.institution}  •  ${edu.location}` : edu.institution;
    this.drawText(
      page,
      instText,
      CV_PDF_FONTS.REGULAR,
      8.5,
      CV_PDF_COLORS.TEXT_MUTED,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );
    y -= 12;

    if (edu.description?.trim()) {
      const lines = this.wrapText(edu.description.trim(), 95);
      for (const line of lines) {
        ensureSpace(14);
        this.drawText(
          page,
          line,
          CV_PDF_FONTS.REGULAR,
          8.5,
          CV_PDF_COLORS.TEXT_MAIN,
          CV_PDF_PAGE.MARGIN_LEFT,
          y,
        );
        y -= 11.5;
      }
    }

    y -= 4;
    return y;
  }

  private drawSkills(
    page: PdfPageStream,
    skills: string[],
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    let y = startY;
    const joined = skills.join("   •   ");
    const lines = this.wrapText(joined, 90);

    for (const line of lines) {
      ensureSpace(14);
      this.drawText(
        page,
        line,
        CV_PDF_FONTS.REGULAR,
        9,
        CV_PDF_COLORS.TEXT_MAIN,
        CV_PDF_PAGE.MARGIN_LEFT,
        y,
      );
      y -= 13;
    }

    return y;
  }

  private drawCertificationItem(
    page: PdfPageStream,
    cert: CvCertificationItem,
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    ensureSpace(25);
    let y = startY;

    this.drawText(
      page,
      cert.title,
      CV_PDF_FONTS.BOLD,
      9,
      CV_PDF_COLORS.TEXT_MAIN,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    if (cert.issueDate) {
      const dateText = this.formatSingleDate(cert.issueDate);
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateText.length * 5.2;
      this.drawText(
        page,
        dateText,
        CV_PDF_FONTS.OBLIQUE,
        8,
        CV_PDF_COLORS.TEXT_MUTED,
        xRight,
        y,
      );
    }
    y -= 11;

    const meta = cert.credentialUrl
      ? `${cert.issuingOrganization}  •  ${cert.credentialUrl.replace(/^https?:\/\//, "")}`
      : cert.issuingOrganization;
    this.drawText(
      page,
      meta,
      CV_PDF_FONTS.REGULAR,
      8,
      CV_PDF_COLORS.TEXT_MUTED,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );
    y -= 11;

    return y;
  }

  private drawProjectItem(
    page: PdfPageStream,
    proj: CvProjectItem,
    startY: number,
    ensureSpace: (needed: number) => void,
  ): number {
    ensureSpace(30);
    let y = startY;

    this.drawText(
      page,
      proj.title,
      CV_PDF_FONTS.BOLD,
      9,
      CV_PDF_COLORS.TEXT_MAIN,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    const tags: string[] = [];
    if (proj.role) tags.push(proj.role);
    if (proj.primaryLanguage) tags.push(proj.primaryLanguage);
    if (typeof proj.starsCount === "number" && proj.starsCount > 0) {
      tags.push(`${proj.starsCount} estrellas`);
    }

    if (tags.length > 0) {
      const tagText = tags.join("  •  ");
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - tagText.length * 4.9;
      this.drawText(
        page,
        tagText,
        CV_PDF_FONTS.REGULAR,
        8,
        CV_PDF_COLORS.TEXT_MUTED,
        xRight,
        y,
      );
    }
    y -= 11;

    if (proj.description?.trim()) {
      const lines = this.wrapText(proj.description.trim(), 95);
      for (const line of lines) {
        ensureSpace(14);
        this.drawText(
          page,
          line,
          CV_PDF_FONTS.REGULAR,
          8.5,
          CV_PDF_COLORS.TEXT_MAIN,
          CV_PDF_PAGE.MARGIN_LEFT,
          y,
        );
        y -= 11;
      }
    }

    if (proj.url) {
      this.drawText(
        page,
        proj.url,
        CV_PDF_FONTS.OBLIQUE,
        8,
        CV_PDF_COLORS.PRIMARY,
        CV_PDF_PAGE.MARGIN_LEFT,
        y,
      );
      y -= 11;
    }

    y -= 4;
    return y;
  }

  private drawPageFooter(
    page: PdfPageStream,
    currentPageNumber: number,
    totalCount: number,
  ): void {
    const y = CV_PDF_PAGE.MARGIN_BOTTOM - 15;
    const [lr, lg, lb] = CV_PDF_COLORS.LINE_MUTED;
    page.operations.push(
      `${lr.toFixed(3)} ${lg.toFixed(3)} ${lb.toFixed(3)} RG 0.5 w`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${(y + 10).toFixed(2)} m ${(CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT).toFixed(2)} ${(y + 10).toFixed(2)} l S`,
    );

    const footerLeft = "UMSSY - Plataforma de Titulados";
    const footerRight = `Página ${currentPageNumber} de ${totalCount}`;

    this.drawText(
      page,
      footerLeft,
      CV_PDF_FONTS.REGULAR,
      8,
      CV_PDF_COLORS.TEXT_MUTED,
      CV_PDF_PAGE.MARGIN_LEFT,
      y,
    );

    const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - footerRight.length * 4.8;
    this.drawText(
      page,
      footerRight,
      CV_PDF_FONTS.REGULAR,
      8,
      CV_PDF_COLORS.TEXT_MUTED,
      xRight,
      y,
    );
  }

  private formatDateSpan(
    startDate: string,
    endDate?: string | null,
    isCurrent?: boolean,
  ): string {
    const start = this.formatSingleDate(startDate);
    if (isCurrent) {
      return `${start} - Presente`;
    }
    if (endDate) {
      return `${start} - ${this.formatSingleDate(endDate)}`;
    }
    return start;
  }

  private formatSingleDate(dateStr: string): string {
    if (!dateStr) return "";
    const match = dateStr.match(/^(\d{4})(?:-(\d{2}))?/);
    if (!match) return dateStr;
    const year = match[1];
    const month = match[2];
    const monthNames = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];
    if (month) {
      const idx = parseInt(month, 10) - 1;
      if (idx >= 0 && idx < 12) {
        return `${monthNames[idx]} ${year}`;
      }
    }
    return year;
  }

  private wrapText(text: string, maxCharsPerLine = 92): string[] {
    if (!text) return [];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private escapePdfText(text: string): string {
    if (!text) return "";
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = text.charCodeAt(i);
      if (char === "\\" || char === "(" || char === ")") {
        result += "\\" + char;
      } else if (code < 128) {
        result += char;
      } else if (code <= 255) {
        result += "\\" + code.toString(8).padStart(3, "0");
      } else if (code === 8226) {
        result += "\\225";
      } else if (code === 8211 || code === 8212) {
        result += "-";
      } else if (code === 8216 || code === 8217) {
        result += "'";
      } else if (code === 8220 || code === 8221) {
        result += "\"";
      } else {
        result += "?";
      }
    }
    return result;
  }

  private compilePdfBuffer(pages: PdfPageStream[]): Buffer {
    return SimplePdfDocument.compileStreams(
      pages,
      CV_PDF_PAGE.WIDTH,
      CV_PDF_PAGE.HEIGHT,
    );
  }
}
