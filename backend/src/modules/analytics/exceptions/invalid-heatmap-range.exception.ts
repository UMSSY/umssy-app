import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidHeatmapRangeException extends DomainException {
  constructor() {
    super(
      'El inicio del rango debe ser anterior o igual al final',
      400,
      'INVALID_HEATMAP_RANGE',
      { field: 'startTimestamp' },
    );
  }
}
