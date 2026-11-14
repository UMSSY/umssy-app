export interface OfflinePass {
  id: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: string;
  qrToken: string;
}
