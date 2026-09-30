const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_SIGNATURE_OFFSET = 8;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }

  return signature.every((byte, index) => bytes[offset + index] === byte);
}

// Detects the real image type from its content instead of trusting the
// extension or the mime type sent by the client.
export function detectImageMimeType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return 'image/jpeg';
  }

  if (startsWith(bytes, PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    startsWith(bytes, RIFF_SIGNATURE) &&
    startsWith(bytes, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)
  ) {
    return 'image/webp';
  }

  return null;
}
