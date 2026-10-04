import { Injectable } from '@nestjs/common';
import type {
  TechnicalAreaRecord,
  TechnicalAreaResponse,
} from '../types/technical-area.type.js';

@Injectable()
export class TechnicalAreasMapper {
  toResponse(record: TechnicalAreaRecord): TechnicalAreaResponse {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
    };
  }

  toResponseList(records: TechnicalAreaRecord[]): TechnicalAreaResponse[] {
    return records.map((record) => this.toResponse(record));
  }
}