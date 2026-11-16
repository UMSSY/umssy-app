"use client";

import { es } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";

interface ExpirationCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  today?: Date;
}

export function ExpirationCalendar({
  selected,
  onSelect,
  today = new Date(),
}: ExpirationCalendarProps) {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return (
    <Calendar
      mode="single"
      locale={es}
      weekStartsOn={1}
      today={today}
      selected={selected}
      onSelect={onSelect}
      disabled={{ before: tomorrow }}
      startMonth={tomorrow}
      defaultMonth={selected ?? tomorrow}
      className="[--cell-size:--spacing(11)]"
    />
  );
}