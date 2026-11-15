import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/services/api-client';

export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const;

interface NotificationUnreadCountResponse {
  data: {
    count: number;
  };
}

export function useNotificationUnreadCount() {
  const { data, isLoading } = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationUnreadCountResponse>(
        '/notifications/unread-count',
      );
      
      return data.data.count;
    },
    refetchInterval: 60_000,
  });

  return {
    unreadCount: data ?? 0,
    isLoading,
  };
}