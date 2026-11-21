export const mentorCapacityQueryKeys = {
  all: ['mentor-capacity'] as const,
  overview: ['mentor-capacity', 'overview'] as const,
  requests: (page?: number) =>
    page === undefined
      ? (['mentor-capacity', 'requests'] as const)
      : (['mentor-capacity', 'requests', page] as const),
  offers: (page?: number) =>
    page === undefined
      ? (['mentor-capacity', 'offers'] as const)
      : (['mentor-capacity', 'offers', page] as const),
};
