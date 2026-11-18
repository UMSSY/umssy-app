
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationPreferenceResponse } from "@/modules/notifications";
import { notificationPreferencesService } from "@/modules/notifications/services/notification-preferences.service";

// Misma clave que usa el hook de modules/notifications, para compartir la caché.
const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  "notifications",
  "preferences",
] as const;

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: () => notificationPreferencesService.get(),
  });

  const mutation = useMutation({
    mutationFn: (preferences: NotificationPreferenceResponse) =>
      notificationPreferencesService.update(preferences),
    onSuccess: (_data, preferences) => {
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, preferences);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    isUpdating: mutation.isPending,
    updatePreferences: (preferences: NotificationPreferenceResponse) =>
      mutation.mutateAsync(preferences),
  };
}
