import { Injectable } from '@nestjs/common';
import { ReportAuthorService } from '../../reports/services/report-author.service.js';
import { ReportPdfService } from '../../reports/services/report-pdf.service.js';
import { CareersService } from '../../surveys/services/careers.service.js';
import { HEATMAP_PDF_TEXT } from '../constants/heatmap-pdf.constants.js';
import type { HeatmapPdfFile } from '../types/heatmap-pdf-file.types.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';
import type { HeatmapType } from '../types/heatmap-type.types.js';
import { buildHeatmapPdfContent } from '../utils/build-heatmap-pdf-content.util.js';
import { buildHeatmapPdfFilters } from '../utils/build-heatmap-pdf-filters.util.js';
import { HeatmapsService } from './heatmaps.service.js';

@Injectable()
export class HeatmapPdfService {
  constructor(
    private readonly heatmaps: HeatmapsService,
    private readonly careers: CareersService,
    private readonly reportAuthor: ReportAuthorService,
    private readonly reportPdf: ReportPdfService,
  ) {}

  async export(
    type: HeatmapType,
    query: HeatmapQuery,
    authorId: string,
    now: Date = new Date(),
  ): Promise<HeatmapPdfFile> {
    const [heatmap, careers, generatedBy] = await Promise.all([
      this.heatmaps.getHeatmap(type, query, now),
      query.careerId ? this.careers.listCareers() : Promise.resolve([]),
      this.reportAuthor.resolveLabel(authorId),
    ]);

    return {
      fileName: HEATMAP_PDF_TEXT.fileName(type),
      content: this.reportPdf.render(
        buildHeatmapPdfContent({
          heatmap,
          filters: buildHeatmapPdfFilters(query, careers),
          generatedBy,
          generatedAt: now,
        }),
      ),
    };
  }
}
