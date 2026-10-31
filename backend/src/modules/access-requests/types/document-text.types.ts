export interface DocumentTextRegion {
  text: string;
  confidence: number;
  page?: number;
  box?: { x: number; y: number; width: number; height: number };
}

export interface DocumentText {
  text: string;
  confidence: number;
  engine?: 'paddle';
  regions?: DocumentTextRegion[];
}
