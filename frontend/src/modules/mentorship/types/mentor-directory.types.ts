export interface MentorDirectoryItem {
  id: string;
  fullName: string;
  headline: string | null;
  technicalAreas: string[];
  photoUrl: string | null;
  education: { degree: string; institution: string } | null;
  isAvailable: boolean;
  orientationTypes: string[];
  sharedInterestsCount?: number;
}

export type MentorSort = "name_asc" | "name_desc" | "affinity";

export type AffinityStatus = "ready" | "no_skills" | "unmapped_skills";

export interface DirectoryPage {
  items: MentorDirectoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  effectiveSort: MentorSort;
  affinityStatus?: AffinityStatus;
}
