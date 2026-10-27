import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function MentorParticipationAccessFallback() {
  return <div className="space-y-4 p-6">
    <p role="alert">Necesitas una participación activa como mentor para editar áreas técnicas.</p>
    <Link href="/mentors/participation" className={buttonVariants({ variant: "outline" })}>Revisar mi participación</Link>
    <Link href="/mentorship" className={buttonVariants()}>Iniciar incorporación</Link>
  </div>;
}
