export function decodeUploadedFileName(originalName: string): string {
  return Buffer.from(originalName, 'latin1').toString('utf8');
}
