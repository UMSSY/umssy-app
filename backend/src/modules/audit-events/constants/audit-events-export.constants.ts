export const AUDIT_CSV_HEADERS = ['Fecha y hora', 'Solicitud', 'Acción', 'Responsable', 'Detalle', 'Evidencia'] as const;

// Tamaño de cada lote leído de la base durante la exportación
export const AUDIT_EXPORT_BATCH_SIZE = 500;

export const AUDIT_CSV_FILE_PREFIX = 'registro-auditoria';

export const AUDIT_CSV_NO_EVIDENCE = 'Sin documento';
