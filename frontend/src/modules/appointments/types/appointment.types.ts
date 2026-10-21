export type AppointmentState = "pending" | "confirmed";

export interface Appointment {
  id: string;
  blockId: string | null;
  mentorId: string;
  studentId: string;
  startAt: string;
  endAt: string;
  state: AppointmentState;
  message: string | null;
  meetingUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
