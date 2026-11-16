import type { OrientationTypeResponse } from './orientation-type-response.types';
import type { TechnicalAreaResponse } from './technical-area-response.types';

export type MentorProfilePreviewProps = {
  mentorId: string;
  technicalAreas: TechnicalAreaResponse[];
  orientationTypes: OrientationTypeResponse[];
  onBack: () => void;
  backLabel?: string;
};