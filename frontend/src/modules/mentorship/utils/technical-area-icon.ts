import { Braces, BrainCircuit, Cloud, CodeXml, Database, Globe, LockKeyhole, Server, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";

const AREA_ICONS: ReadonlyArray<[RegExp, LucideIcon]> = [
  [/bases? de datos|database|sql/i, Database],
  [/inteligencia artificial|machine learning|ciencia de datos|data science/i, BrainCircuit],
  [/seguridad|ciberseguridad|security/i, LockKeyhole],
  [/cloud|nube|devops|infraestructura/i, Cloud],
  [/frontend|front-end|web/i, Globe],
  [/m[oó]vil|mobile|android|ios/i, Smartphone],
  [/testing|qa|calidad/i, ShieldCheck],
  [/api|backend|back-end|servidor/i, Server],
  [/programaci[oó]n|desarrollo|software/i, CodeXml],
];

export function resolveTechnicalAreaIcon(name: string): LucideIcon {
  return AREA_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Braces;
}
