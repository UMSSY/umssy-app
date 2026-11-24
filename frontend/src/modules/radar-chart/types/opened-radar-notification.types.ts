export interface OpenedRadarNotification {
  notification: {
    id: string;
    version: number;
    readAt: string;
  };
  radar: import('./integration-radar.types').IntegrationRadar;
  compare: boolean;
}
