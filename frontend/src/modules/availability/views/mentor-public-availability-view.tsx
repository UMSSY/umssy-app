"use client";

import { useMentorFreeBlocks } from "../hooks/use-mentor-free-blocks";
import { AvailabilityBlockList } from "../components/availability-block-list";

interface MentorPublicAvailabilityViewProps {
  mentorId: string;
}

export function MentorPublicAvailabilityView({ mentorId }: MentorPublicAvailabilityViewProps) {
  const { blocks, isLoading, error } = useMentorFreeBlocks(mentorId);

  if (isLoading) {
    return <div className="p-6 text-center">Cargando disponibilidad...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Disponibilidad del Mentor</h1>
      <AvailabilityBlockList blocks={blocks} emptyMessage="No hay bloques de disponibilidad disponibles." />
    </div>
  );
}
