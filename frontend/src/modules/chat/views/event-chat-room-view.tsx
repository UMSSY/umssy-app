"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useEventRoom } from "../hooks/use-event-room";

export function EventChatRoomView() {
  const { id: eventId } = useParams<{ id: string }>();
  const { conversationId, isJoined, error, joinEventRoom, leaveEventRoom } = useEventRoom();

  useEffect(() => {
    if (eventId && isJoined === false) {
      joinEventRoom(eventId);
    }
  }, [eventId, isJoined, joinEventRoom]);

  useEffect(() => {
    if (!eventId) leaveEventRoom();
  }, [eventId, leaveEventRoom]);

  return (
    <div>
      <h2>{isJoined ? "Sala de evento" : "Uniéndose al evento"}</h2>

      {conversationId && <div>Mensajes cargados</div>}

      {error && !isJoined && error === "not_registered" && <div>No registrado</div>}
    </div>
  );
}