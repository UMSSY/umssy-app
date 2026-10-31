export interface LinkPreviewResponse {
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  hasPreview: boolean;
}

