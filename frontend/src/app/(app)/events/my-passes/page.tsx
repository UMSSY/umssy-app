'use client';
import { useRouter } from 'next/navigation';
import { MyPassesView } from '@/modules/events';
import { getEventRoomPath } from '@/modules/chat';

export default function MyPassesPage() {
  const router = useRouter();

  return (
    <MyPassesView
      onOpenWorkshopChat={(registrationId) =>
        router.push(getEventRoomPath(registrationId))
      }
    />
  );
}