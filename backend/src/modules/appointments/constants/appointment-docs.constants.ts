export const APPOINTMENT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  required: [
    'id',
    'blockId',
    'startAt',
    'endAt',
    'orientationType',
    'counterpart',
    'status',
  ],
  properties: {
    id: { type: 'string' as const, format: 'uuid' },
    blockId: { type: 'string' as const, format: 'uuid', nullable: true },
    startAt: { type: 'string' as const, format: 'date-time' },
    endAt: { type: 'string' as const, format: 'date-time' },
    orientationType: {
      type: 'object' as const,
      nullable: true,
      required: ['id', 'name'],
      properties: {
        id: { type: 'string' as const, format: 'uuid' },
        name: { type: 'string' as const },
      },
    },
    counterpart: {
      type: 'object' as const,
      required: ['id', 'fullName'],
      properties: {
        id: { type: 'string' as const, format: 'uuid' },
        fullName: { type: 'string' as const },
      },
    },
    status: { type: 'string' as const, example: 'CONFIRMED' },
  },
};
