import type { ProposalCover } from '../types/proposal.types';
import { validateProposalCover } from './proposal-validation';

export async function readProposalCover(file: File): Promise<ProposalCover> {
  const error = validateProposalCover(file);
  if (error) throw new Error(error);
  const previewUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth > 0 ? resolve() : reject(new Error('empty image'));
      image.onerror = () => reject(new Error('invalid image'));
      image.src = previewUrl;
    });
    return { file, previewUrl };
  } catch {
    URL.revokeObjectURL(previewUrl);
    throw new Error('No se pudo leer la imagen. Selecciona otro archivo JPG o PNG.');
  }
}
