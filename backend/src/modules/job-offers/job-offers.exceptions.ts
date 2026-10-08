export class SalaryRangeInvalidException extends Error {
  readonly statusCode = 422;
  readonly code = 'SALARY_RANGE_INVALID';

  constructor() {
    super('El salario minimo no puede ser mayor al salario maximo.');
    this.name = 'SalaryRangeInvalidException';
  }
}

export class TechnologyNotFoundException extends Error {
  readonly statusCode = 422;
  readonly code = 'TECHNOLOGY_NOT_FOUND';

  constructor(tecnologias: string[]) {
    super(
      `Las siguientes tecnologias no existen en el catalogo: ${tecnologias.join(', ')}.`
    );
    this.name = 'TechnologyNotFoundException';
  }
}

export class TechnologyLimitExceededException extends Error {
  readonly statusCode = 422;
  readonly code = 'TECHNOLOGY_LIMIT_EXCEEDED';

  constructor() {
    super('Se alcanzo el tope maximo de 10 tecnologias por vacante.');
    this.name = 'TechnologyLimitExceededException';
  }
}

export class CompanyNotFoundException extends Error {
  readonly statusCode = 404;
  readonly code = 'COMPANY_NOT_FOUND';

  constructor() {
    super('La empresa no existe.');
    this.name = 'CompanyNotFoundException';
  }
}