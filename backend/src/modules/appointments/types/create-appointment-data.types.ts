export interface CreateAppointmentData {
  blockId: string;
  mentorId: string;
  studentId: string;
  startAt: Date;
  endAt: Date;
  statusId: string;
  orientationTypeId: string;
  message?: string | null;
}
