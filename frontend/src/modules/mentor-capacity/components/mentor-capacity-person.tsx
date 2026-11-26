interface MentorCapacityPersonProps {
  firstName: string;
  lastName: string;
  email: string;
}

export function MentorCapacityPerson({
  firstName,
  lastName,
  email,
}: MentorCapacityPersonProps) {
  return (
    <div>
      <p className="font-medium text-foreground">
        {firstName} {lastName}
      </p>
      <p className="text-xs text-text-secondary">{email}</p>
    </div>
  );
}
