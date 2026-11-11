import { Injectable } from "@nestjs/common";
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

interface PdfPageStream {
  operations: string[];
}

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

    // First page top accent bar
    this.drawTopAccentBar(currentPage);

    // Draw header (Name, headline, contact info)
    currentY = this.drawMainHeader(currentPage, data.personalInfo, currentY);

    const sections = options?.sections;

    // 1. Professional Summary
    if (sections?.includeSummary !== false && data.summary?.trim()) {
      ensureSpace(60);
      currentY = this.drawSectionHeader(currentPage, "PRESENTACIÓN PROFESIONAL", currentY);
      currentY = this.drawParagraph(currentPage, data.summary.trim(), currentY, ensureSpace);
      currentY -= 10;
    }

    // 2. Work Experience
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

    // 3. Education
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

    // 4. Skills
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

    // 5. Certifications
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

    // 6. Projects
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

    // Draw footers on all pages
    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      this.drawPageFooter(pages[i], i + 1, totalPages);
    }

    return this.compilePdfBuffer(pages);
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
  ): number {
    let y = startY;

    // Candidate Name
    const [pr, pg, pb] = CV_PDF_COLORS.PRIMARY;
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 20 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(info.fullName)}) Tj ET`,
    );
    y -= 18;

    // Professional headline
    if (info.headline?.trim()) {
      const [sr, sg, sb] = CV_PDF_COLORS.TEXT_MUTED;
      page.operations.push(
        `BT ${CV_PDF_FONTS.BOLD} 11 Tf ${sr.toFixed(3)} ${sg.toFixed(3)} ${sb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(info.headline.trim())}) Tj ET`,
      );
      y -= 16;
    }

    // Contact info row
    const contactParts: string[] = [];
    if (info.email) contactParts.push(info.email);
    if (info.phone) contactParts.push(info.phone);
    if (info.location) contactParts.push(info.location);
    if (info.linkedinUrl) contactParts.push(info.linkedinUrl.replace(/^https?:\/\//, ""));
    if (info.githubUrl) contactParts.push(info.githubUrl.replace(/^https?:\/\//, ""));
    if (info.gitlabUrl) contactParts.push(info.gitlabUrl.replace(/^https?:\/\//, ""));
    if (info.portfolioUrl) contactParts.push(info.portfolioUrl.replace(/^https?:\/\//, ""));

    if (contactParts.length > 0) {
      const contactText = contactParts.join("  •  ");
      const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MUTED;
      const lines = this.wrapText(contactText, 85);
      for (const line of lines) {
        page.operations.push(
          `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
        );
        y -= 12;
      }
    }

    y -= 4;
    // Header divider line
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
    const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MUTED;
    const continuationText = `${fullName}  •  Currículum Vitae`;
    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(continuationText)}) Tj ET`,
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

    // Small vertical marker
    page.operations.push(
      `${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg`,
      `${CV_PDF_PAGE.MARGIN_LEFT} ${(y - 2).toFixed(2)} 3 11 re f`,
    );

    // Section title
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 10.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${(CV_PDF_PAGE.MARGIN_LEFT + 7).toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(title)}) Tj ET`,
    );
    y -= 6;

    // Subtle horizontal rule
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
    const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MAIN;
    const lines = this.wrapText(text, 96);

    for (const line of lines) {
      ensureSpace(14);
      page.operations.push(
        `BT ${CV_PDF_FONTS.REGULAR} 9 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
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

    // Line 1: Job title (Bold) and Date range (Right/Italic)
    const [pr, pg, pb] = CV_PDF_COLORS.TEXT_MAIN;
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 9.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(exp.jobTitle)}) Tj ET`,
    );

    const dateSpan = this.formatDateSpan(exp.startDate, exp.endDate, exp.isCurrent);
    if (dateSpan) {
      const [dr, dg, db] = CV_PDF_COLORS.TEXT_MUTED;
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateSpan.length * 5.2;
      page.operations.push(
        `BT ${CV_PDF_FONTS.OBLIQUE} 8.5 Tf ${dr.toFixed(3)} ${dg.toFixed(3)} ${db.toFixed(3)} rg ${xRight.toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(dateSpan)}) Tj ET`,
      );
    }
    y -= 12;

    // Line 2: Company and optional location
    const companyText = exp.location ? `${exp.company}  •  ${exp.location}` : exp.company;
    const [cr, cg, cb] = CV_PDF_COLORS.TEXT_MUTED;
    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${cr.toFixed(3)} ${cg.toFixed(3)} ${cb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(companyText)}) Tj ET`,
    );
    y -= 12;

    // Line 3+: Description
    if (exp.description?.trim()) {
      const descLines = this.wrapText(exp.description.trim(), 95);
      for (const line of descLines) {
        ensureSpace(14);
        page.operations.push(
          `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
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

    const [pr, pg, pb] = CV_PDF_COLORS.TEXT_MAIN;
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 9.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(edu.degree)}) Tj ET`,
    );

    const dateSpan = this.formatDateSpan(edu.startDate, edu.endDate, edu.isCurrent);
    if (dateSpan) {
      const [dr, dg, db] = CV_PDF_COLORS.TEXT_MUTED;
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateSpan.length * 5.2;
      page.operations.push(
        `BT ${CV_PDF_FONTS.OBLIQUE} 8.5 Tf ${dr.toFixed(3)} ${dg.toFixed(3)} ${db.toFixed(3)} rg ${xRight.toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(dateSpan)}) Tj ET`,
      );
    }
    y -= 12;

    const instText = edu.location ? `${edu.institution}  •  ${edu.location}` : edu.institution;
    const [cr, cg, cb] = CV_PDF_COLORS.TEXT_MUTED;
    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${cr.toFixed(3)} ${cg.toFixed(3)} ${cb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(instText)}) Tj ET`,
    );
    y -= 12;

    if (edu.description?.trim()) {
      const lines = this.wrapText(edu.description.trim(), 95);
      for (const line of lines) {
        ensureSpace(14);
        page.operations.push(
          `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
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
    const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MAIN;
    const joined = skills.join("   •   ");
    const lines = this.wrapText(joined, 90);

    for (const line of lines) {
      ensureSpace(14);
      page.operations.push(
        `BT ${CV_PDF_FONTS.REGULAR} 9 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
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

    const [pr, pg, pb] = CV_PDF_COLORS.TEXT_MAIN;
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 9 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(cert.title)}) Tj ET`,
    );

    if (cert.issueDate) {
      const [dr, dg, db] = CV_PDF_COLORS.TEXT_MUTED;
      const dateText = this.formatSingleDate(cert.issueDate);
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - dateText.length * 5.2;
      page.operations.push(
        `BT ${CV_PDF_FONTS.OBLIQUE} 8 Tf ${dr.toFixed(3)} ${dg.toFixed(3)} ${db.toFixed(3)} rg ${xRight.toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(dateText)}) Tj ET`,
      );
    }
    y -= 11;

    const meta = cert.credentialUrl
      ? `${cert.issuingOrganization}  •  ${cert.credentialUrl.replace(/^https?:\/\//, "")}`
      : cert.issuingOrganization;
    const [mr, mg, mb] = CV_PDF_COLORS.TEXT_MUTED;
    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8 Tf ${mr.toFixed(3)} ${mg.toFixed(3)} ${mb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(meta)}) Tj ET`,
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

    const [pr, pg, pb] = CV_PDF_COLORS.TEXT_MAIN;
    page.operations.push(
      `BT ${CV_PDF_FONTS.BOLD} 9 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(proj.title)}) Tj ET`,
    );

    const tags: string[] = [];
    if (proj.role) tags.push(proj.role);
    if (proj.primaryLanguage) tags.push(proj.primaryLanguage);
    if (typeof proj.starsCount === "number" && proj.starsCount > 0) {
      tags.push(`${proj.starsCount} estrellas`);
    }

    if (tags.length > 0) {
      const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MUTED;
      const tagText = tags.join("  •  ");
      const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - tagText.length * 4.9;
      page.operations.push(
        `BT ${CV_PDF_FONTS.REGULAR} 8 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${xRight.toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(tagText)}) Tj ET`,
      );
    }
    y -= 11;

    if (proj.description?.trim()) {
      const lines = this.wrapText(proj.description.trim(), 95);
      for (const line of lines) {
        ensureSpace(14);
        page.operations.push(
          `BT ${CV_PDF_FONTS.REGULAR} 8.5 Tf ${pr.toFixed(3)} ${pg.toFixed(3)} ${pb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(line)}) Tj ET`,
        );
        y -= 11;
      }
    }

    if (proj.url) {
      const [ur, ug, ub] = CV_PDF_COLORS.PRIMARY;
      page.operations.push(
        `BT ${CV_PDF_FONTS.OBLIQUE} 8 Tf ${ur.toFixed(3)} ${ug.toFixed(3)} ${ub.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(proj.url)}) Tj ET`,
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

    const [tr, tg, tb] = CV_PDF_COLORS.TEXT_MUTED;
    const footerLeft = "UMSSY - Plataforma de Titulados";
    const footerRight = `Página ${currentPageNumber} de ${totalCount}`;

    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${CV_PDF_PAGE.MARGIN_LEFT} ${y.toFixed(2)} Td (${this.escapePdfText(footerLeft)}) Tj ET`,
    );

    const xRight = CV_PDF_PAGE.WIDTH - CV_PDF_PAGE.MARGIN_RIGHT - footerRight.length * 4.8;
    page.operations.push(
      `BT ${CV_PDF_FONTS.REGULAR} 8 Tf ${tr.toFixed(3)} ${tg.toFixed(3)} ${tb.toFixed(3)} rg ${xRight.toFixed(2)} ${y.toFixed(2)} Td (${this.escapePdfText(footerRight)}) Tj ET`,
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

  public escapePdfText(text: string): string {
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
        // Octal escape for 8-bit WinAnsi encoding
        result += "\\" + code.toString(8).padStart(3, "0");
      } else if (code === 8226) {
        // bullet • (0x95 in WinAnsi, octal 225)
        result += "\\225";
      } else if (code === 8211 || code === 8212) {
        // En-dash / Em-dash
        result += "-";
      } else if (code === 8216 || code === 8217) {
        // Curly single quotes
        result += "'";
      } else if (code === 8220 || code === 8221) {
        // Curly double quotes
        result += "\"";
      } else {
        result += "?";
      }
    }
    return result;
  }

  private compilePdfBuffer(pages: PdfPageStream[]): Buffer {
    const objects: string[] = [];
    const pageCount = pages.length;

    // 1: Catalog
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");

    // 2: Pages root
    const pageKidsRefs: string[] = [];
    const basePageObjIndex = 6; // Pages start at object 6
    for (let i = 0; i < pageCount; i++) {
      const pageObjNum = basePageObjIndex + i * 2;
      pageKidsRefs.push(`${pageObjNum} 0 R`);
    }
    objects.push(
      `<< /Type /Pages /Kids [${pageKidsRefs.join(" ")}] /Count ${pageCount} >>`,
    );

    // 3: Font Regular (Helvetica)
    objects.push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    );
    // 4: Font Bold (Helvetica-Bold)
    objects.push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    );
    // 5: Font Oblique (Helvetica-Oblique)
    objects.push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>",
    );

    // For each page: create Page Object + Stream Object
    for (let i = 0; i < pageCount; i++) {
      const streamObjNum = basePageObjIndex + i * 2 + 1;
      // Page Object
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${CV_PDF_PAGE.WIDTH.toFixed(2)} ${CV_PDF_PAGE.HEIGHT.toFixed(2)}] /Contents ${streamObjNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> >>`,
      );

      // Stream Object
      const streamContent = pages[i].operations.join("\n");
      const streamByteLength = Buffer.byteLength(streamContent, "latin1");
      objects.push(
        `<< /Length ${streamByteLength} >>\nstream\n${streamContent}\nendstream`,
      );
    }

    // Assemble final PDF
    let out = "%PDF-1.4\n";
    const offsets: number[] = [0];

    for (let i = 0; i < objects.length; i++) {
      offsets.push(Buffer.byteLength(out, "latin1"));
      out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(out, "latin1");
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(out, "latin1");
  }
}
