export interface CityOption {
  id: string;
  title: string;
}

export interface UserProfile {
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

export interface PersonalInfoValues {
  firstName: string;
  lastName: string;
  cityId: string;
  phone: string;
  personalEmail: string;
}

export interface PresentationValues {
  headline: string;
  aboutMe: string;
  interestedOpportunities: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type ProfileTab = "personal" | "presentation" | "trajectory" | "documents";

export interface FormFeedback {
  type: "success" | "error";
  message: string;
}
