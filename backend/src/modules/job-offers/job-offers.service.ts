import { Inject, Injectable } from '@nestjs/common';

interface CreateJobOfferPayload {
  tituloPuesto: string;
  descripcion: string;
  modalidad: 'Presencial' | 'Remoto' | 'Hibrido';
  ubicacion: string;
  tipoContrato: 'Tiempo completo' | 'Medio tiempo' | 'Pasantia';
  categoria: string;
  numeroVacantes: number;
  salarioMin: number;
  salarioMax: number;
  idiomas: string;
  enlaceGoogleMaps: string;
  tecnologias: string[];
}

class CompanyNotFoundException extends Error {
  readonly statusCode = 404;
  readonly code = 'COMPANY_NOT_FOUND';
  constructor() {
    super('La empresa no existe.');
    this.name = 'CompanyNotFoundException';
  }
}

class SalaryRangeInvalidException extends Error {
  readonly statusCode = 422;
  readonly code = 'SALARY_RANGE_INVALID';
  constructor() {
    super('El salario minimo no puede ser mayor al salario maximo.');
    this.name = 'SalaryRangeInvalidException';
  }
}

class TechnologyNotFoundException extends Error {
  readonly statusCode = 422;
  readonly code = 'TECHNOLOGY_NOT_FOUND';
  constructor(tecnologias: string[]) {
    super(`Las siguientes tecnologias no existen en el catalogo: ${tecnologias.join(', ')}.`);
    this.name = 'TechnologyNotFoundException';
  }
}

@Injectable()
export class JobOffersService {
  constructor(@Inject('PRISMA_SERVICE') private readonly prisma: any) {}

  async create(empresaId: string, payload: CreateJobOfferPayload) {
    const company = await this.prisma.company.findUnique({
      where: { id: empresaId },
    });

    if (!company) throw new CompanyNotFoundException();
    if (payload.salarioMin > payload.salarioMax) throw new SalaryRangeInvalidException();

    const tecnologiasValidas = await this.prisma.technology.findMany({
      where: { name: { in: payload.tecnologias } },
    });

    if (tecnologiasValidas.length !== payload.tecnologias.length) {
      const noEncontradas = payload.tecnologias.filter(
        (t: string) => !tecnologiasValidas.some((tv: any) => tv.name === t)
      );
      throw new TechnologyNotFoundException(noEncontradas);
    }

    const jobOffer = await this.prisma.jobOffer.create({
      data: {
        title: payload.tituloPuesto,
        description: payload.descripcion,
        modality: payload.modalidad,
        location: payload.ubicacion,
        contractType: payload.tipoContrato,
        category: payload.categoria,
        numberOfPositions: payload.numeroVacantes,
        salaryMin: payload.salarioMin,
        salaryMax: payload.salarioMax,
        languages: payload.idiomas,
        googleMapsUrl: payload.enlaceGoogleMaps,
        status: 'DRAFT',
        companyId: empresaId,
        technologies: {
          create: tecnologiasValidas.map((t: any) => ({
            technologyId: t.id,
          })),
        },
      },
      include: { technologies: true },
    });

    return {
      id: jobOffer.id,
      estado: jobOffer.status,
      fechaCreacion: jobOffer.createdAt,
      mensaje: 'Oferta publicada correctamente',
    };
  }
}