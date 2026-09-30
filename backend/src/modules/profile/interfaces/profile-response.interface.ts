export interface CityOption {
  id: string;
  title: string;
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  institutionalEmail: string;
  personalEmail: string | null;
  phone: string | null;
  city: CityOption | null;
  headline: string | null;
  aboutMe: string | null;
  interestedOpportunities: string | null;
  photoPath: string | null;
  updatedAt: string;
}

export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface ProfilePhoto {
  data: Uint8Array;
  mimeType: string;
}
