export function proposalLocationError(raw: string, modality: string): string | undefined {
  const location = raw.trim();
  if (!location) return modality === 'virtual' ? 'Pega el enlace de la reunión.' : 'Escribe la ubicación del taller.';
  if (modality === 'presencial') {
    if (location.length > 150) return 'Usa hasta 150 caracteres.';
    if (!/\p{L}/u.test(location)) return 'Incluye el nombre del lugar.';
    if (location.startsWith(',') || location.endsWith(',')) return 'Quita la coma del inicio o del final.';
    const parts = location.split(',');
    if (parts.some(part => !part.trim())) return 'Completa o elimina la parte vacía entre comas.';
    if (parts.some(part => !/[\p{L}\p{N}]/u.test(part))) return 'Reemplaza los símbolos por un lugar o referencia.';
    if (parts.length > 4) return 'Usa hasta 4 partes separadas por comas.';
  }
  if (modality === 'virtual') {
    if (location.length > 2000) return 'Usa un enlace de hasta 2000 caracteres.';
    if (!/^https:\/\//i.test(location)) return 'El enlace debe comenzar con https://.';
    if (/\s/u.test(location)) return 'Quita los espacios del enlace.';
    if (/\\/u.test(location)) return 'Usa barras / en lugar de barras invertidas.';
    if (!/^https:\/\/[^/?#]+/i.test(location)) return 'Completa la dirección después de https://.';
    try {
      const url = new URL(location);
      if (!url.hostname || url.protocol !== 'https:') return 'Revisa la dirección del enlace.';
      if (url.username || url.password) return 'Usa un enlace sin usuario ni contraseña incluidos.';
    } catch { return 'Revisa la dirección del enlace.'; }
  }
  return undefined;
}
