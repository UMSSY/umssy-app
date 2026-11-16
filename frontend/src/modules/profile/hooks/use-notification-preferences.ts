import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notification-preferences.service';
import type { UpdateNotificationPreferencePayload } from '../types/notification-preference.types';

export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['notification-preferences'] as const;

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateNotificationPreferencePayload) =>
      updateNotificationPreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updatePreferences: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}