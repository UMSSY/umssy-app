import { Injectable } from '@nestjs/common';
import { USER_TYPE_LABELS } from '../constants/report-user-csv.constants.js';
import { REPORT_PDF_TEXT } from '../constants/report-pdf.constants.js';
import { ReportAuthorNotFoundException } from '../exceptions/report-author-not-found.exception.js';
import { ReportUsersRepository } from '../repositories/report-users.repository.js';

@Injectable()
export class ReportAuthorService {
  constructor(private readonly reportUsersRepository: ReportUsersRepository) {}

  async resolveLabel(authorId: string): Promise<string> {
    const author = await this.reportUsersRepository.findAuthor(authorId);
    const fullName = [author?.firstName, author?.lastName]
      .map((name) => (name ?? '').trim())
      .filter(Boolean)
      .join(' ');
    if (!fullName) throw new ReportAuthorNotFoundException();
    return REPORT_PDF_TEXT.author(fullName, USER_TYPE_LABELS.administrativo);
  }
}
