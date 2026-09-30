import Image from "next/image";
import { getFullName, getInitials } from "../utils/profile-format";

type AvatarSize = "sm" | "md" | "lg";

interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  size?: AvatarSize;
  placeholder?: string;
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 40, md: 80, lg: 112 };

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-10 w-10 text-[12.5px]",
  md: "h-20 w-20 text-[18px]",
  lg: "h-24 w-24 text-[16px] md:h-28 md:w-28",
};

export function ProfileAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
  placeholder,
}: ProfileAvatarProps) {
  const sizeClass = SIZE_CLASS[size];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={`Fotografía de ${getFullName(firstName, lastName)}`}
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        unoptimized
        className={`${sizeClass} shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-soft font-tight font-bold text-ink-soft`}
    >
      {placeholder ?? getInitials(firstName, lastName)}
    </span>
  );
}
