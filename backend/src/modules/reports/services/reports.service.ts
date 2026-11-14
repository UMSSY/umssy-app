import {
  REPORT_USER_CSV_HEADERS,
  USER_TYPE_LABELS,
} from '../constants/report-user-csv.constants.js';
import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/types/api-response.types.js';
import { buildCsv } from '../../../common/utils/csv.js';
import { buildExportFileName } from '../../../common/utils/file-name.js';
import { paginate } from '../../../common/utils/pagination.js';
import {
  toRegisteredUserCsvRow,
  toRejectedUserCsvRow,
  toReportUserPdfRow,
} from '../mappers/report-user-csv.mapper.js';
import {
  PDF_EXTENSION,
  REGISTERED_USERS_PDF,
  REJECTED_USERS_PDF,
  REPORT_PDF_TEXT,
} from '../constants/report-pdf.constants.js';
import { ReportAuthorNotFoundException } from '../exceptions/report-author-not-found.exception.js';
import { buildReportPdfFilters } from '../utils/report-pdf-filters.util.js';
import { ReportPdfService } from './report-pdf.service.js';
import {
  toRegisteredUserResponse,
  toRejectedUserResponse,
} from '../mappers/report-user.mapper.js';
import { ReportUsersRepository } from '../repositories/report-users.repository.js';
import type {
  RegisteredUsersFilters,
  RegisteredUsersExportQuery,
  RegisteredUsersQuery,
  RejectedUsersFilters,
  RejectedUsersExportQuery,
  RejectedUsersQuery,
} from '../requests/report-users.schema.js';
import type {
  RegisteredUserResponse,
  RejectedUserResponse,
  ReportCsvFile,
  ReportUser,
} from '../types/report-user.types.js';
import type {
  ReportPdfDefinition,
  ReportPdfFile,
} from '../types/report-pdf.types.js';
import { getAcademicPeriod } from '../utils/academic-period.js';

const REGISTERED_USERS_CSV_PREFIX = 'usuarios-registrados';
const REJECTED_USERS_CSV_PREFIX = 'usuarios-rechazados';
const CSV_EXTENSION = 'csv';
const ALL_PERIODS_FILE_NAME_SUFFIX = 'todos';

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function containsSearch(values: string[], search?: string): boolean {
  if (!search) {
    return true;
  }

  const term = normalizeText(search);
  return values.some((value) => normalizeText(value).includes(term));
}

function isListedBefore(user: ReportUser, snapshotAt?: string): boolean {
  return !snapshotAt || new Date(user.listedAt) <= new Date(snapshotAt);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function sortByNewest(users: ReportUser[]): ReportUser[] {
  return users.sort(
    (first, second) =>
      new Date(second.registeredAt).getTime() -
        new Date(first.registeredAt).getTime() ||
      first.id.localeCompare(second.id),
  );
}

function paginateExport<T>(items: T[], page?: number, limit?: number): T[] {
  if (page === undefined || limit === undefined) return items;

  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportUsersRepository: ReportUsersRepository,
    private readonly reportPdfService: ReportPdfService,
  ) {}

  async getRegisteredUsers(
    query: RegisteredUsersQuery,
  ): Promise<PaginatedResult<RegisteredUserResponse>> {
    const users = await this.findRegisteredUsers(query);
    return paginate(users, query.page, query.limit);
  }

  async exportRegisteredUsersCsv(
    filters: RegisteredUsersExportQuery,
  ): Promise<ReportCsvFile> {
    const users = paginateExport(await this.findRegisteredUsers(filters), filters.page, filters.limit);
    return {
      fileName: this.registeredFileName(filters, CSV_EXTENSION),
      content: buildCsv(REPORT_USER_CSV_HEADERS, users.map(toRegisteredUserCsvRow)),
    };
  }

  async exportRegisteredUsersPdf(
    filters: RegisteredUsersExportQuery,
    authorId: string,
  ): Promise<ReportPdfFile> {
    const users = paginateExport(await this.findRegisteredUsers(filters), filters.page, filters.limit);
    return {
      fileName: this.registeredFileName(filters, PDF_EXTENSION),
      content: await this.renderPdf(REGISTERED_USERS_PDF, filters, users, authorId),
    };
  }

  async getRejectedUsers(
    query: RejectedUsersQuery,
  ): Promise<PaginatedResult<RejectedUserResponse>> {
    const users = await this.findRejectedUsers(query);
    return paginate(users, query.page, query.limit);
  }

  async exportRejectedUsersCsv(
    filters: RejectedUsersExportQuery,
  ): Promise<ReportCsvFile> {
    const users = paginateExport(await this.findRejectedUsers(filters), filters.page, filters.limit);
    return {
      fileName: this.rejectedFileName(filters, CSV_EXTENSION),
      content: buildCsv(REPORT_USER_CSV_HEADERS, users.map(toRejectedUserCsvRow)),
    };
  }

  async exportRejectedUsersPdf(
    filters: RejectedUsersExportQuery,
    authorId: string,
  ): Promise<ReportPdfFile> {
    const users = paginateExport(await this.findRejectedUsers(filters), filters.page, filters.limit);
    return {
      fileName: this.rejectedFileName(filters, PDF_EXTENSION),
      content: await this.renderPdf(REJECTED_USERS_PDF, filters, users, authorId),
    };
  }

  private registeredFileName(filters: RegisteredUsersExportQuery, extension: string): string {
    return buildExportFileName(
      REGISTERED_USERS_CSV_PREFIX,
      [filters.userType && USER_TYPE_LABELS[filters.userType], filters.search],
      filters.period ?? ALL_PERIODS_FILE_NAME_SUFFIX,
      extension,
    );
  }

  private rejectedFileName(filters: RejectedUsersExportQuery, extension: string): string {
    return buildExportFileName(
      REJECTED_USERS_CSV_PREFIX,
      [filters.userType && USER_TYPE_LABELS[filters.userType], filters.search],
      filters.period ?? todayIsoDate(),
      extension,
    );
  }

  private async renderPdf(
    definition: ReportPdfDefinition,
    filters: RegisteredUsersExportQuery | RejectedUsersExportQuery,
    users: (RegisteredUserResponse | RejectedUserResponse)[],
    authorId: string,
  ): Promise<Buffer> {
    const author = await this.reportUsersRepository.findAuthor(authorId);
    const fullName = [author?.firstName, author?.lastName]
      .map((name) => (name ?? '').trim())
      .filter(Boolean)
      .join(' ');
    if (!fullName) throw new ReportAuthorNotFoundException();

    return this.reportPdfService.render({
      ...definition,
      generatedBy: REPORT_PDF_TEXT.author(fullName, USER_TYPE_LABELS.administrativo),
      generatedAt: new Date(),
      filters: buildReportPdfFilters(definition.dateFilterLabel, filters),
      rows: users.map(toReportUserPdfRow),
    });
  }

  private async findRegisteredUsers(
    filters: RegisteredUsersFilters,
  ): Promise<RegisteredUserResponse[]> {
    const users = (await this.reportUsersRepository.findAll())
      .filter((user) => user.registrationStatus === 'APPROVED')
      .filter(
        (user) =>
          filters.userType === undefined || user.userType === filters.userType,
      )
      .filter(
        (user) =>
          filters.period === undefined ||
          getAcademicPeriod(user.registeredAt) === filters.period,
      )
      .filter((user) => containsSearch([user.email], filters.search))
      .filter((user) => isListedBefore(user, filters.snapshotAt));

    return sortByNewest(users).map(toRegisteredUserResponse);
  }

  private async findRejectedUsers(
    filters: RejectedUsersFilters,
  ): Promise<RejectedUserResponse[]> {
    const users = (await this.reportUsersRepository.findAll())
      .filter((user) => user.registrationStatus === 'REJECTED')
      .filter(
        (user) =>
          filters.userType === undefined || user.userType === filters.userType,
      )
      .filter(
        (user) =>
          filters.period === undefined ||
          getAcademicPeriod(user.registeredAt) === filters.period,
      )
      .filter((user) => containsSearch([user.email], filters.search))
      .filter((user) => isListedBefore(user, filters.snapshotAt));

    return sortByNewest(users).map(toRejectedUserResponse);
  }
}
