import { CloudUpload, Cpu, ShieldCheck, Target } from 'lucide-react';
export const VERIFICATION_FLOW_STEPS = [
  ['Documento subido', CloudUpload],
  ['OCR / NLP procesado', Cpu],
  ['Validación automática', ShieldCheck],
  ['Radar actualizado', Target],
] as const;
