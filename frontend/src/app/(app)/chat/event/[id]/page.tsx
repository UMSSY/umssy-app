import { EventChatRoomView } from '@/modules/chat';

export const metadata = {
  title: 'Sala del evento',
  description: 'Chat grupal del evento',
};

export default async function EventChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EventChatRoomView registrationId={id} />;
}
