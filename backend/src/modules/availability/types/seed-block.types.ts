export interface SeedBlock {
  id: string;
  mentorKey: 'primary' | 'performance';
  start: Date;
  end: Date;
  appointmentId?: string;
  seriesId?: string;
  repeatUntil?: Date;
}
