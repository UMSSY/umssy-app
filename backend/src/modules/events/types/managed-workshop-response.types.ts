export interface ManagedWorkshopResponse {
  id: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  coverUrl?: string;
}
