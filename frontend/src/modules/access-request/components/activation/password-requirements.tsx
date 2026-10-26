import { Check, Circle } from "lucide-react";
import { getPasswordRules } from "../../utils/password-rules";

export function PasswordRequirements({ password, id }: { password: string; id: string }) {
  return (
    <ul id={id} aria-label="Requisitos de la contraseña" className="mt-3 space-y-1.5">
      {getPasswordRules(password).map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-2 text-sm ${rule.met ? "text-accent" : "text-text-secondary"}`}
        >
          {rule.met ? <Check aria-hidden="true" className="size-4" /> : <Circle aria-hidden="true" className="size-4" />}
          {rule.label}
          <span className="sr-only">{rule.met ? "(cumplido)" : "(pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}
