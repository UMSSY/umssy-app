const ENTRANCE_CLASS = "motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in";

export const CARD_MOTION_CLASS = [
  "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md",
  ENTRANCE_CLASS,
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
].join(" ");

export const FILTER_BAR_MOTION_CLASS = [
  "transition-shadow duration-200 focus-within:shadow-md",
  ENTRANCE_CLASS,
  "motion-reduce:transition-none",
].join(" ");
