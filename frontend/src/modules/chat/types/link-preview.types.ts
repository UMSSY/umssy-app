export interface LinkPreviewData {
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  hasPreview: boolean;
}

export type LinkPreviewResponse = LinkPreviewData;

