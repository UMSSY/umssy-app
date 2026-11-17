import type { AreaId } from './area-id.types';
import type { AreaLevel } from './area-level.types';
import type { Course } from './course.types';
import type { Certification } from './certification.types';
import type { ExperienceItem } from './experience-item.types';

export interface AreaDetail {
  id: AreaId;
  name: string;
  score: number;
  level: AreaLevel;
  globalAverage: number;
  gap: number;
  courses: Course[];
  certifications: Certification[];
  experience: ExperienceItem[];
  tags: string[];
}
