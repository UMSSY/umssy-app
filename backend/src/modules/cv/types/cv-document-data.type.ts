export interface CvPersonalInfo {
  fullName: string;
  headline?: string;
  email: string;
  phone?: string;
  location?: string;
  githubUrl?: string;
  gitlabUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

export interface CvWorkExperience {
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
}

export interface CvEducation {
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
}

export interface CvSkillItem {
  name: string;
  category?: string;
}

export interface CvCertificationItem {
  title: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string | null;
  credentialUrl?: string;
}

export interface CvProjectItem {
  title: string;
  role?: string;
  primaryLanguage?: string;
  starsCount?: number;
  description?: string;
  url?: string;
}

export interface CvDocumentData {
  personalInfo: CvPersonalInfo;
  summary?: string;
  workExperiences?: CvWorkExperience[];
  educations?: CvEducation[];
  skills?: CvSkillItem[];
  certifications?: CvCertificationItem[];
  projects?: CvProjectItem[];
}
