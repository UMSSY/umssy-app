export interface MentorFiltersBarProps {
  area: string;
  orientation: string;
  technicalAreas: string[];
  orientationTypes: string[];
  onAreaChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
}
