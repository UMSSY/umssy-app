export interface MentorGuidanceType {
  id: number;
  name: string;
  description: string;
}

export interface MentorProfile {
  id: number;
  name: string;
  specialty: string;
  professionalInterests: string[];
  position: string;
  company: string;
  yearsExperience: number;
  faculty: string;
  program: string;
  description: string;
  profileImage?: string;
  isAvailable: boolean;
  technicalAreas: string[];
  guidanceTypes: MentorGuidanceType[];
}
