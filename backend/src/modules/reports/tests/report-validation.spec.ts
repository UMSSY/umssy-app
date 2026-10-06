import { REPORT_VALIDATION_MESSAGES as MESSAGES } from '../constants/report-validation.constants.js';
import { reportHistoryQuerySchema } from '../requests/report-history.schema.js';
import {
  registeredUsersQuerySchema,
  rejectedUsersQuerySchema,
} from '../requests/report-users.schema.js';

function getMessages(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}): string[] {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe('Mensajes de validación de reportes', () => {
  it.each([
    [{ page: 'abc' }, MESSAGES.pageInvalid],
    [{ page: '1.5' }, MESSAGES.pageInvalid],
    [{ page: '0' }, MESSAGES.pageMin],
    [{ limit: 'x' }, MESSAGES.limitInvalid],
    [{ limit: '0' }, MESSAGES.limitMin],
    [{ limit: '101' }, MESSAGES.limitMax],
  ])('pagina en español: %o', (query, message) => {
    expect(getMessages(reportHistoryQuerySchema.safeParse(query))).toEqual([
      message,
    ]);
  });

  it.each([
    [{ userType: 'OTRO' }, MESSAGES.userTypeInvalid],
    [{ year: 'dos mil' }, MESSAGES.yearInvalid],
    [{ year: '2019' }, MESSAGES.yearMin],
    [{ search: 'a'.repeat(101) }, MESSAGES.searchMax],
  ])('filtros de registrados en español: %o', (query, message) => {
    expect(getMessages(registeredUsersQuerySchema.safeParse(query))).toEqual([
      message,
    ]);
  });

  it('valida la búsqueda de rechazados en español', () => {
    const result = rejectedUsersQuerySchema.safeParse({ search: ['a', 'b'] });

    expect(getMessages(result)).toEqual([MESSAGES.searchInvalid]);
  });

  it('acepta filtros válidos y aplica valores por defecto', () => {
    expect(
      registeredUsersQuerySchema.parse({
        userType: 'MENTOR',
        year: '2024',
        search: '  ana ',
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      userType: 'MENTOR',
      year: 2024,
      search: 'ana',
    });
  });
});
