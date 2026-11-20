export interface MentorFiltersBarProps {
  area: string;
  areaAsChips?: boolean;
  orientation: string;
  technicalAreas: string[];
  orientationTypes: string[];
  onAreaChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
}
