export interface RadarNotification {
  id: string;
  message: string;
  version: number;
  createdAt: string;
  readAt: string | null;
}

export interface OpenedRadarNotification {
  notification: {
    id: string;
    version: number;
    readAt: string;
  };
  radar: import("./integration-radar.types").IntegrationRadar;
  compare: boolean;
}